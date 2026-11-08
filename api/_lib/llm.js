// Model providers. Both are real: the buyer picks per call with "model": "claude" | "openai".
import { HttpError } from './core.js';

const CLAUDE_MODEL = () => process.env.ZF_CLAUDE_MODEL || 'claude-sonnet-5-5';
const OPENAI_MODEL = () => process.env.ZF_OPENAI_MODEL || 'gpt-4.1-mini';

export function pickProvider(requested) {
  const want = String(requested || process.env.ZF_DEFAULT_MODEL || 'claude').toLowerCase();
  const have = { claude: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY };
  if (want !== 'claude' && want !== 'openai') throw new HttpError(400, 'invalid_model', 'model must be "claude" or "openai"');
  if (have[want]) return want;
  const other = want === 'claude' ? 'openai' : 'claude';
  if (!requested && have[other]) return other;
  throw new HttpError(503, 'model_not_configured', `${want === 'claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'} is not set on this deployment`);
}

/** messages: [{ role: 'user' | 'assistant', content: string }] */
export async function complete(provider, system, messages, maxTokens = 1200) {
  const started = Date.now();
  if (provider === 'claude') {
    const model = CLAUDE_MODEL();
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: AbortSignal.timeout(55000),
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new HttpError(502, 'model_error', `Anthropic returned ${r.status}`, { detail: j?.error?.message });
    const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    return { text, model: `anthropic/${j.model || model}`, usage: j.usage, latency: Date.now() - started };
  }
  const model = OPENAI_MODEL();
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(55000),
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, ...messages] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, 'model_error', `OpenAI returned ${r.status}`, { detail: j?.error?.message });
  return { text: j.choices?.[0]?.message?.content || '', model: `openai/${j.model || model}`, usage: j.usage, latency: Date.now() - started };
}

export function cleanMessages(list) {
  if (!Array.isArray(list) || list.length === 0) throw new HttpError(400, 'invalid_messages', 'messages must be a non-empty array of { role, content }');
  if (list.length > 40) throw new HttpError(400, 'too_many_messages', 'Send at most 40 messages');
  const out = list.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content ?? '').slice(0, 8000) }));
  if (out[out.length - 1].role !== 'user') throw new HttpError(400, 'invalid_messages', 'The last message must be from the user');
  return out;
}
