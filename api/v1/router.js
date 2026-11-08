// ZenFlow runtime API v1. Every /api/v1/* path is rewritten here (see vercel.json).
import { createPublicKey, verify as edVerify, createHmac, timingSafeEqual } from 'node:crypto';
import { waitUntil } from '@vercel/functions';
import {
  INVENTORY, DATASETS, BY_ID, PUBLIC_ORIGIN, HttpError, rpc, authorize, logRun, deliver,
  readBody, jsonBody, formBody, send, findAsset, systemPrompt, statusOf,
} from '../_lib/core.js';
import { pickProvider, complete, cleanMessages } from '../_lib/llm.js';
import { queryDataset, CONNECTORS } from '../_lib/connectors.js';
import { buildN8n } from '../_lib/n8n.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Api-Key, X-Source-Key, X-Source-Client-Id',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

const publicAsset = (a) => ({
  id: a.id, title: a.title, category: a.category, publisher: a.publisher, summary: a.summary,
  pending: !!a.pending, pricing: a.pricing, version: a.version, integrations: a.integrations,
  aegis: a.aegis, runtime: a.runtime && { ...a.runtime, prompt: undefined },
  url: `${PUBLIC_ORIGIN}/?listing=${a.id}`,
});

// ---------- runs ----------

async function runLlm(req, asset, messages, { model, maxTokens = 1200, deliverEvent = true } = {}) {
  const auth = await authorize(req);
  const provider = pickProvider(model);
  const out = await complete(provider, systemPrompt(asset), messages, maxTokens);
  const status = statusOf(out.text);
  const runId = await logRun(auth.key, asset, { model: out.model, status, input: messages[messages.length - 1].content, output: out.text, latency: out.latency });
  const result = { run_id: runId, asset: asset.id, status, model: out.model, output: out.text, usage: out.usage, latency_ms: out.latency, remaining_today: auth.remaining - 1 };
  if (deliverEvent) waitUntil(deliver(auth.key, asset.id, 'run.completed', result));
  return result;
}

async function agentRun(req, res, id) {
  const asset = findAsset(id, 'agents');
  const b = await jsonBody(req);
  const input = b.input ?? b.prompt;
  if (input === undefined || input === '') throw new HttpError(400, 'missing_input', 'Send { "input": "..." } (a string or JSON object)');
  const text = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  const messages = [{ role: 'user', content: (b.context ? `Context:\n${String(b.context).slice(0, 12000)}\n\n` : '') + text.slice(0, 16000) }];
  send(res, 200, await runLlm(req, asset, messages, { model: b.model, maxTokens: Math.min(Number(b.max_tokens) || 1500, 4000) }));
}

async function botChat(req, res, id) {
  const asset = findAsset(id, 'bots');
  const b = await jsonBody(req);
  const messages = b.messages ? cleanMessages(b.messages) : cleanMessages([{ role: 'user', content: b.message }]);
  send(res, 200, await runLlm(req, asset, messages, { model: b.model, maxTokens: 700 }));
}

async function taskRun(req, res) {
  const b = await jsonBody(req);
  const asset = findAsset(String(b.workflow || ''), 'workflows');
  if (!b.step) throw new HttpError(400, 'missing_step', 'Send { "workflow", "step", "input" }');
  const content = `Workflow step: ${String(b.step).slice(0, 200)}\nDo only this step. Return the result as JSON with an "output" field and any fields the next step needs.\n\nInput:\n${JSON.stringify(b.input ?? {}, null, 2).slice(0, 16000)}`;
  const r = await runLlm(req, { ...asset, runtime: { prompt: `You run one step of the ZenFlow workflow "${asset.title}" (${asset.runtime.steps.join(' → ')}).` } }, [{ role: 'user', content }], { model: b.model, deliverEvent: false });
  let parsed = null;
  try { parsed = JSON.parse(r.output.replace(/^```(json)?\s*|\s*```$/g, '')); } catch { /* plain text is fine */ }
  send(res, 200, { ...r, ...(parsed && typeof parsed === 'object' ? parsed : { output: r.output }), run_id: r.run_id, status: r.status });
}

async function workflowTrigger(req, res, id) {
  const asset = findAsset(id, 'workflows');
  const auth = await authorize(req);
  const payload = await jsonBody(req);
  const started = Date.now();
  const deliveries = await deliver(auth.key, asset.id, 'workflow.trigger', { steps: asset.runtime.steps, payload });
  const ok = deliveries.filter((d) => d.status >= 200 && d.status < 300).length;
  const status = deliveries.length === 0 ? 'no_target' : ok ? 'ok' : 'delivery_failed';
  const runId = await logRun(auth.key, asset, { status, input: JSON.stringify(payload), output: JSON.stringify(deliveries), latency: Date.now() - started });
  send(res, deliveries.length ? 202 : 409, {
    run_id: runId, asset: asset.id, status, deliveries,
    ...(deliveries.length ? {} : { hint: `Import ${PUBLIC_ORIGIN}${asset.runtime.n8n} into n8n, then register its Webhook URL: POST /api/v1/webhooks { "asset_id": "${asset.id}", "url": "<n8n webhook URL>", "events": ["workflow.trigger"] }` }),
  });
}

async function database(req, res, id) {
  const asset = findAsset(id, 'databases');
  const spec = DATASETS[id];
  if (!spec) throw new HttpError(404, 'not_found', `No dataset "${id}"`);
  const auth = await authorize(req);
  let out;
  try { out = await queryDataset(id, spec, req); } catch (e) {
    if (e instanceof HttpError && e.status >= 500) await logRun(auth.key, asset, { status: 'error', input: JSON.stringify(req.zfQuery), output: e.message }).catch(() => {});
    throw e;
  }
  const rows = out.rows || [];
  const runId = await logRun(auth.key, asset, { status: 'ok', input: JSON.stringify(out.params), output: `${rows.length} rows`, latency: out.latency });
  send(res, 200, {
    run_id: runId, asset: id, source: { name: spec.source.name, url: spec.source.url, license: spec.source.license },
    params: out.params, fetched_at: new Date().toISOString(), count: rows.length, ...(out.summary ? { summary: out.summary } : {}), rows,
  }, { 'Cache-Control': 'private, no-store' });
}

// ---------- bot adapters ----------

function slackVerified(req, raw, secret) {
  if (!secret) return true;
  const ts = req.headers['x-slack-request-timestamp']; const sig = String(req.headers['x-slack-signature'] || '');
  if (!ts || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const mine = `v0=${createHmac('sha256', secret).update(`v0:${ts}:${raw}`).digest('hex')}`;
  return mine.length === sig.length && timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
}

async function slack(req, res, id) {
  const asset = findAsset(id, 'bots');
  const raw = await readBody(req);
  if (!slackVerified(req, raw, req.zfQuery.signing_secret)) throw new HttpError(401, 'bad_signature', 'Slack signature check failed');
  const f = formBody(raw);
  if (!f.response_url) throw new HttpError(400, 'not_slack', 'Expected a Slack slash-command payload');
  await authorize(req);
  const text = f.text || 'Hello';
  waitUntil((async () => {
    let reply;
    try { reply = (await runLlm(req, asset, [{ role: 'user', content: text }], { maxTokens: 600 })).output; } catch (e) { reply = `Sorry, that didn't work (${e.code || 'error'}).`; }
    await fetch(f.response_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ response_type: 'in_channel', text: reply }) }).catch(() => {});
  })());
  send(res, 200, { response_type: 'ephemeral', text: `${asset.title} is on it…` });
}

const ED_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
function discordVerified(req, raw, publicKeyHex) {
  try {
    const key = createPublicKey({ key: Buffer.concat([ED_PREFIX, Buffer.from(publicKeyHex, 'hex')]), format: 'der', type: 'spki' });
    const sig = Buffer.from(String(req.headers['x-signature-ed25519'] || ''), 'hex');
    const ts = String(req.headers['x-signature-timestamp'] || '');
    return edVerify(null, Buffer.from(ts + raw), key, sig);
  } catch { return false; }
}

async function discord(req, res, id) {
  const asset = findAsset(id, 'bots');
  const raw = await readBody(req);
  const pk = req.zfQuery.public_key;
  if (!pk || !discordVerified(req, raw, pk)) { res.statusCode = 401; return res.end('invalid request signature'); }
  const i = JSON.parse(raw);
  if (i.type === 1) return send(res, 200, { type: 1 });
  await authorize(req);
  const text = (i.data?.options || []).map((o) => o.value).join(' ') || i.data?.name || 'Hello';
  waitUntil((async () => {
    let reply;
    try { reply = (await runLlm(req, asset, [{ role: 'user', content: text }], { maxTokens: 600 })).output; } catch (e) { reply = `Sorry, that didn't work (${e.code || 'error'}).`; }
    await fetch(`https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: reply.slice(0, 1990) }) }).catch(() => {});
  })());
  send(res, 200, { type: 5 });
}

function twilioVerified(req, url, params, token) {
  if (!token) return true;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('');
  const mine = createHmac('sha1', token).update(data).digest('base64');
  const sig = String(req.headers['x-twilio-signature'] || '');
  return mine.length === sig.length && timingSafeEqual(Buffer.from(mine), Buffer.from(sig));
}

async function sms(req, res, id) {
  const asset = findAsset(id, 'bots');
  const f = formBody(await readBody(req));
  const fullUrl = `https://${req.headers['x-forwarded-host'] || req.headers.host}${req.zfOriginalUrl}`;
  if (!twilioVerified(req, fullUrl, f, req.zfQuery.twilio_token)) throw new HttpError(401, 'bad_signature', 'Twilio signature check failed');
  let reply;
  try { reply = (await runLlm(req, asset, [{ role: 'user', content: f.Body || '' }], { maxTokens: 300 })).output; } catch (e) { reply = `Sorry, that didn't work (${e.code || 'error'}).`; }
  const esc = reply.slice(0, 1500).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
  res.statusCode = 200; res.setHeader('Content-Type', 'text/xml');
  res.end(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`);
}

// ---------- account ----------

async function webhooks(req, res, rest) {
  const auth = await authorize(req);
  if (req.method === 'GET') {
    const rows = await rpc('zf_list_webhooks', { api_key: auth.key, for_asset: req.zfQuery.asset_id || null });
    return send(res, 200, { webhooks: rows.map(({ secret, ...w }) => ({ ...w, secret_hint: `${secret.slice(0, 10)}…` })) });
  }
  if (req.method === 'POST') {
    const b = await jsonBody(req);
    if (!b.url || !String(b.url).startsWith('https://')) throw new HttpError(400, 'invalid_url', 'url must be https');
    const assetId = b.asset_id || '*';
    if (assetId !== '*' && !BY_ID.has(assetId)) throw new HttpError(404, 'not_found', `No asset "${assetId}"`);
    const events = Array.isArray(b.events) && b.events.length ? b.events : ['run.completed'];
    const bad = events.filter((e) => !['run.completed', 'workflow.trigger'].includes(e));
    if (bad.length) throw new HttpError(400, 'invalid_event', `Unknown events: ${bad.join(', ')}`);
    const w = await rpc('zf_add_webhook', { api_key: auth.key, asset_id: assetId, url: b.url, events });
    return send(res, 201, { ...w, asset_id: assetId, url: b.url, events, note: 'Store the secret now. Verify each delivery: HMAC-SHA256 of "<t>.<raw body>" must equal v1 in the ZenFlow-Signature header.' });
  }
  if (req.method === 'DELETE' && rest[0]) {
    const ok = await rpc('zf_delete_webhook', { api_key: auth.key, webhook_id: rest[0] });
    return send(res, ok ? 200 : 404, { deleted: !!ok });
  }
  throw new HttpError(405, 'method_not_allowed', 'Use GET, POST or DELETE /webhooks/:id');
}

async function runs(req, res) {
  const auth = await authorize(req);
  const rows = await rpc('zf_list_runs', { api_key: auth.key, max_rows: Math.min(Number(req.zfQuery.limit) || 50, 200) });
  send(res, 200, { runs: rows });
}

async function issueKey(req, res) {
  const b = await jsonBody(req);
  const admin = String(req.headers['x-admin-token'] || '');
  if (!admin) throw new HttpError(401, 'missing_admin_token', 'Send X-Admin-Token');
  if (!b.owner_email) throw new HttpError(400, 'missing_owner', 'Send { "owner_email", "label", "daily_limit" }');
  const k = await rpc('zf_issue_key', { admin_token: admin, owner_email: b.owner_email, label: b.label || null, daily_limit: Math.min(Number(b.daily_limit) || 200, 100000) });
  send(res, 201, { ...k, note: 'Shown once. ZenFlow stores only a hash.' });
}

// ---------- discovery ----------

function openapi() {
  const key = [{ bearer: [] }];
  return {
    openapi: '3.1.0',
    info: { title: 'ZenFlow Marketplace runtime API', version: '1.0.0', description: 'Run agents and bots, trigger workflows and query databases listed on the ZenFlow Marketplace. Every run is written to your audit log.' },
    servers: [{ url: `${PUBLIC_ORIGIN}/api/v1` }],
    components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', description: 'zf_live_ API key' } } },
    paths: {
      '/assets': { get: { summary: 'List assets', parameters: [{ name: 'category', in: 'query', schema: { enum: ['agents', 'workflows', 'bots', 'databases'] } }] } },
      '/assets/{id}': { get: { summary: 'One asset' } },
      '/agents/{id}/run': { post: { security: key, summary: 'Run an agent', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['input'], properties: { input: {}, context: { type: 'string' }, model: { enum: ['claude', 'openai'] }, max_tokens: { type: 'integer' } } } } } } } },
      '/bots/{id}/chat': { post: { security: key, summary: 'Chat with a bot', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' }, messages: { type: 'array' }, model: { enum: ['claude', 'openai'] } } } } } } } },
      '/bots/{id}/slack': { post: { summary: 'Slack slash-command request URL (?key=&signing_secret=)' } },
      '/bots/{id}/discord': { post: { summary: 'Discord interactions endpoint (?key=&public_key=)' } },
      '/bots/{id}/sms': { post: { summary: 'Twilio messaging webhook (?key=&twilio_token=)' } },
      '/workflows/{id}/trigger': { post: { security: key, summary: 'Trigger a workflow; forwarded to your workflow.trigger webhooks' } },
      '/workflows/{id}/n8n.json': { get: { summary: 'Importable n8n workflow' } },
      '/tasks/run': { post: { security: key, summary: 'Run one workflow step (used by the n8n agent nodes)' } },
      '/databases/{id}': { get: { security: key, summary: 'Query a database; parameters per asset in /assets/{id}' } },
      '/webhooks': { get: { security: key }, post: { security: key, summary: 'Subscribe { asset_id, url, events }' } },
      '/webhooks/{id}': { delete: { security: key } },
      '/runs': { get: { security: key, summary: 'Your audit log' } },
      '/health': { get: { summary: 'Runtime status' } },
    },
  };
}

// ---------- router ----------

export default async function handler(req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  const u = new URL(req.url, 'http://x');
  const query = Object.fromEntries(u.searchParams);
  const path = (query.__path ?? u.pathname.replace(/^\/api\/v1\/?/, '')).replace(/^\/+|\/+$/g, '');
  delete query.__path;
  req.zfQuery = query;
  req.zfOriginalUrl = `/api/v1/${path}${Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''}`;
  const [a, b, c, ...more] = path.split('/');
  const m = req.method;
  try {
    if (m === 'GET' && (path === '' || a === 'health')) {
      return send(res, 200, {
        ok: true, version: '1.0.0', assets: INVENTORY.length, connectors: CONNECTORS.length,
        models: { claude: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY },
        audit_log: !!process.env.ZF_SERVER_TOKEN, docs: `${PUBLIC_ORIGIN}/api/v1/openapi.json`,
      });
    }
    if (m === 'GET' && a === 'openapi.json') return send(res, 200, openapi());
    if (m === 'GET' && a === 'assets') {
      if (b) { const x = BY_ID.get(b); if (!x) throw new HttpError(404, 'not_found', `No asset "${b}"`); return send(res, 200, publicAsset(x)); }
      const list = INVENTORY.filter((x) => !query.category || x.category === query.category);
      return send(res, 200, { count: list.length, assets: list.map(publicAsset) }, { 'Cache-Control': 'public, max-age=300' });
    }
    if (m === 'POST' && a === 'agents' && c === 'run') return await agentRun(req, res, b);
    if (m === 'POST' && a === 'bots' && c === 'chat') return await botChat(req, res, b);
    if (m === 'POST' && a === 'bots' && c === 'slack') return await slack(req, res, b);
    if (m === 'POST' && a === 'bots' && c === 'discord') return await discord(req, res, b);
    if (m === 'POST' && a === 'bots' && c === 'sms') return await sms(req, res, b);
    if (m === 'POST' && a === 'tasks' && b === 'run') return await taskRun(req, res);
    if (m === 'POST' && a === 'workflows' && c === 'trigger') return await workflowTrigger(req, res, b);
    if (m === 'GET' && a === 'workflows' && c === 'n8n.json') {
      const x = findAsset(b, 'workflows');
      return send(res, 200, buildN8n(x), { 'Content-Disposition': `attachment; filename="zenflow-${x.id}.n8n.json"`, 'Cache-Control': 'public, max-age=3600' });
    }
    if (m === 'GET' && a === 'databases' && b) return await database(req, res, b);
    if (a === 'webhooks') return await webhooks(req, res, [b, c, ...more].filter(Boolean));
    if (m === 'GET' && a === 'runs') return await runs(req, res);
    if (m === 'POST' && a === 'keys') return await issueKey(req, res);
    throw new HttpError(404, 'not_found', `No route ${m} /api/v1/${path}`);
  } catch (e) {
    if (res.headersSent) return;
    if (e instanceof HttpError) return send(res, e.status, { error: { code: e.code, message: e.message, ...e.extra } });
    console.error(e);
    return send(res, 500, { error: { code: 'internal', message: 'Unexpected error' } });
  }
}
