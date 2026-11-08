// Builds an importable n8n workflow for each ZenFlow workflow listing.
// App steps are real HTTP Request nodes against the app's public API, authenticated with n8n's
// predefined credential for that app, so the buyer's credentials stay in their own n8n.
// Steps that are thinking work (summarise, draft, score) call the ZenFlow task endpoint.
// Irreversible steps sit behind a Wait node that resumes only when a person approves.
import { randomUUID } from 'node:crypto';
import { PUBLIC_ORIGIN } from './core.js';

// keyword -> real endpoint + n8n credential type
const APPS = [
  { match: /Slack/, name: 'Slack', cred: 'slackApi', method: 'POST', url: 'https://slack.com/api/chat.postMessage', body: { channel: '={{ $json.channel || "#general" }}', text: '={{ $json.text || $json.output }}' } },
  { match: /Gmail|email/i, name: 'Gmail', cred: 'gmailOAuth2', method: 'POST', url: 'https://gmail.googleapis.com/gmail/v1/users/me/drafts', body: { message: { raw: '={{ $json.raw_email }}' } } },
  { match: /HubSpot|CRM/, name: 'HubSpot', cred: 'hubspotAppToken', method: 'POST', url: 'https://api.hubapi.com/crm/v3/objects/contacts', body: { properties: '={{ $json.properties || {} }}' } },
  { match: /Google Sheets|Sheet/, name: 'Google Sheets', cred: 'googleSheetsOAuth2Api', method: 'POST', url: '=https://sheets.googleapis.com/v4/spreadsheets/{{ $json.spreadsheet_id }}/values/A1:append?valueInputOption=USER_ENTERED', body: { values: '={{ [Object.values($json)] }}' } },
  { match: /Google Calendar|Calendar/, name: 'Google Calendar', cred: 'googleCalendarOAuth2Api', method: 'POST', url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events', body: { summary: '={{ $json.title }}', start: '={{ $json.start }}', end: '={{ $json.end }}' } },
  { match: /Google Drive|Drive/, name: 'Google Drive', cred: 'googleDriveOAuth2Api', method: 'GET', url: 'https://www.googleapis.com/drive/v3/files', query: { q: '={{ $json.query || "trashed=false" }}', pageSize: '20' } },
  { match: /Notion/, name: 'Notion', cred: 'notionApi', method: 'POST', url: 'https://api.notion.com/v1/pages', headers: { 'Notion-Version': '2022-06-28' }, body: { parent: { database_id: '={{ $json.database_id }}' }, properties: '={{ $json.properties || {} }}' } },
  { match: /Jira/, name: 'Jira', cred: 'jiraSoftwareCloudApi', method: 'POST', url: '=https://{{ $json.jira_site }}.atlassian.net/rest/api/3/issue', body: { fields: '={{ $json.fields }}' } },
  { match: /GitHub/, name: 'GitHub', cred: 'githubApi', method: 'POST', url: '=https://api.github.com/repos/{{ $json.repo }}/issues', body: { title: '={{ $json.title }}', body: '={{ $json.output }}' } },
  { match: /Stripe|invoice|payment/i, name: 'Stripe', cred: 'stripeApi', method: 'GET', url: 'https://api.stripe.com/v1/charges', query: { limit: '25' } },
  { match: /Shopify/, name: 'Shopify', cred: 'shopifyAccessTokenApi', method: 'GET', url: '=https://{{ $json.shop }}.myshopify.com/admin/api/2024-10/orders.json', query: { status: 'any', limit: '50' } },
  { match: /Twilio|SMS|text message/i, name: 'Twilio', cred: 'twilioApi', method: 'POST', url: '=https://api.twilio.com/2010-04-01/Accounts/{{ $json.account_sid }}/Messages.json', form: { To: '={{ $json.to }}', From: '={{ $json.from }}', Body: '={{ $json.output }}' } },
  { match: /Trello/, name: 'Trello', cred: 'trelloApi', method: 'POST', url: 'https://api.trello.com/1/cards', query: { idList: '={{ $json.list_id }}', name: '={{ $json.title }}' } },
  { match: /Asana/, name: 'Asana', cred: 'asanaApi', method: 'POST', url: 'https://app.asana.com/api/1.0/tasks', body: { data: { name: '={{ $json.title }}', projects: '={{ [$json.project_id] }}' } } },
  { match: /Zoom/, name: 'Zoom', cred: 'zoomOAuth2Api', method: 'GET', url: 'https://api.zoom.us/v2/users/me/recordings' },
  { match: /YouTube/, name: 'YouTube', cred: 'youTubeOAuth2Api', method: 'GET', url: 'https://www.googleapis.com/youtube/v3/videos', query: { part: 'snippet', id: '={{ $json.video_id }}' } },
  { match: /LinkedIn/, name: 'LinkedIn', cred: 'linkedInOAuth2Api', method: 'POST', url: 'https://api.linkedin.com/v2/ugcPosts', body: { author: '={{ $json.author_urn }}', lifecycleState: 'PUBLISHED', specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: '={{ $json.output }}' }, shareMediaCategory: 'NONE' } }, visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' } } },
  { match: /Tweet|X \(Twitter\)|Twitter/, name: 'X (Twitter)', cred: 'twitterOAuth2Api', method: 'POST', url: 'https://api.x.com/2/tweets', body: { text: '={{ $json.output }}' } },
  { match: /QuickBooks/, name: 'QuickBooks', cred: 'quickBooksOAuth2Api', method: 'GET', url: '=https://quickbooks.api.intuit.com/v3/company/{{ $json.realm_id }}/query', query: { query: 'select * from Invoice maxresults 50' } },
  { match: /Xero/, name: 'Xero', cred: 'xeroOAuth2Api', method: 'GET', url: 'https://api.xero.com/api.xro/2.0/Invoices' },
  { match: /DocuSign|signature/i, name: 'DocuSign', cred: 'httpHeaderAuth', method: 'POST', url: '=https://demo.docusign.net/restapi/v2.1/accounts/{{ $json.account_id }}/envelopes', body: { status: 'sent', emailSubject: '={{ $json.subject }}' } },
  { match: /Typeform/, name: 'Typeform', cred: 'typeformApi', method: 'GET', url: '=https://api.typeform.com/forms/{{ $json.form_id }}/responses' },
  { match: /BambooHR/, name: 'BambooHR', cred: 'bambooHrApi', method: 'GET', url: '=https://api.bamboohr.com/api/gateway.php/{{ $json.company }}/v1/employees/directory' },
  { match: /Open-Meteo|weather/i, name: 'Open-Meteo', cred: null, method: 'GET', url: 'https://api.open-meteo.com/v1/forecast', query: { latitude: '={{ $json.lat }}', longitude: '={{ $json.lon }}', daily: 'temperature_2m_max,precipitation_sum' } },
  { match: /OFAC|sanction/i, name: 'OFAC SDN', cred: null, method: 'GET', url: `${PUBLIC_ORIGIN}/api/v1/databases/sanctions-ofac`, query: { q: '={{ $json.name }}' }, zenflow: true },
  { match: /OSV|vulnerab/i, name: 'OSV', cred: null, method: 'POST', url: 'https://api.osv.dev/v1/query', body: { package: { name: '={{ $json.package }}', ecosystem: '={{ $json.ecosystem || "npm" }}' } } },
  { match: /Coinbase/, name: 'Coinbase', cred: null, method: 'GET', url: '=https://api.coinbase.com/v2/prices/{{ $json.pair || "BTC-USD" }}/spot' },
];

const IRREVERSIBLE = /send|post|publish|pay|charge|sign|delete|refund|transfer|order|submit|book|email|tweet|reply|message|invoice|unlock/i;

const node = (name, type, typeVersion, parameters, position, extra = {}) => ({ id: randomUUID(), name, type, typeVersion, position, parameters, ...extra });

function toParams(obj) {
  return Object.entries(obj || {}).map(([name, value]) => ({ name, value: typeof value === 'string' ? value : `={{ ${JSON.stringify(value)} }}` }));
}

function appNode(app, step, pos) {
  const p = { method: app.method, url: app.url, options: {} };
  if (app.cred) { p.authentication = app.cred === 'httpHeaderAuth' ? 'genericCredentialType' : 'predefinedCredentialType'; if (app.cred === 'httpHeaderAuth') p.genericAuthType = 'httpHeaderAuth'; else p.nodeCredentialType = app.cred; }
  if (app.zenflow) { p.authentication = 'genericCredentialType'; p.genericAuthType = 'httpHeaderAuth'; }
  if (app.query) { p.sendQuery = true; p.queryParameters = { parameters: toParams(app.query) }; }
  if (app.headers) { p.sendHeaders = true; p.headerParameters = { parameters: toParams(app.headers) }; }
  if (app.body) { p.sendBody = true; p.specifyBody = 'json'; p.jsonBody = `={{ ${JSON.stringify(app.body).replace(/"=\{\{ (.*?) \}\}"/g, (_, e) => e.replace(/\\"/g, '"'))} }}`; }
  if (app.form) { p.sendBody = true; p.contentType = 'form-urlencoded'; p.bodyParameters = { parameters: toParams(app.form) }; }
  return node(`${step} (${app.name})`, 'n8n-nodes-base.httpRequest', 4.2, p, pos, { notes: `Connect your ${app.name} credential in n8n before switching this step on.`, retryOnFail: true, maxTries: 2 });
}

function agentNode(asset, step, pos) {
  return node(`${step} (ZenFlow agent)`, 'n8n-nodes-base.httpRequest', 4.2, {
    method: 'POST', url: `${PUBLIC_ORIGIN}/api/v1/tasks/run`,
    authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
    sendBody: true, specifyBody: 'json',
    jsonBody: `={{ JSON.stringify({ workflow: ${JSON.stringify(asset.id)}, step: ${JSON.stringify(step)}, input: $json }) }}`,
    options: { timeout: 60000 },
  }, pos, { notes: 'Header Auth credential: name "Authorization", value "Bearer zf_live_..." (your ZenFlow key).', retryOnFail: true, maxTries: 2 });
}

export function buildN8n(asset) {
  const steps = asset.runtime.steps || [];
  const approvalLine = (asset.aegis.refusals || []).find((r) => r.startsWith('Pauses for approval before:'));
  const approve = new Set((approvalLine ? approvalLine.split(':')[1] : '').split(',').map((s) => s.trim()).filter(Boolean));
  const nodes = []; const connections = {};
  let x = 0; const y = 300;
  const trigger = asset.runtime.trigger === 'schedule'
    ? node('Every morning', 'n8n-nodes-base.scheduleTrigger', 1.2, { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 8 }] } }, [x, y])
    : node('ZenFlow trigger', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: `zenflow-${asset.id}`, responseMode: 'onReceived', options: {} }, [x, y], { webhookId: randomUUID() });
  nodes.push(trigger);
  let prev = trigger.name;
  const link = (to) => { connections[prev] = { main: [[{ node: to, type: 'main', index: 0 }]] }; prev = to; };

  // The first step is usually what the trigger delivers; it still runs if it names an app to fetch from.
  steps.forEach((step, i) => {
    x += 260;
    const app = APPS.find((a) => a.match.test(step));
    const gated = approve.has(step) || (i > 0 && app && IRREVERSIBLE.test(step) && app.method !== 'GET');
    if (gated) {
      const wait = node(`Approve: ${step}`, 'n8n-nodes-base.wait', 1.1, { resume: 'webhook', httpMethod: 'POST', options: {} }, [x, y], { webhookId: randomUUID(), notes: 'Paused for a person. POST to this node\'s resume URL to approve.' });
      nodes.push(wait); link(wait.name); x += 260;
    }
    const n = app ? appNode(app, step, [x, y]) : agentNode(asset, step, [x, y]);
    nodes.push(n); link(n.name);
  });

  return {
    name: `ZenFlow · ${asset.title}`,
    nodes, connections, active: false,
    settings: { executionOrder: 'v1', saveDataErrorExecution: 'all' },
    meta: { templateCredsSetupCompleted: false, zenflow: { asset: asset.id, version: asset.version, source: `${PUBLIC_ORIGIN}/api/v1/workflows/${asset.id}/n8n.json` } },
    pinData: {},
  };
}
