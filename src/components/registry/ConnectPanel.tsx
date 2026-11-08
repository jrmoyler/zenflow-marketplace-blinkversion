import { useState } from 'react';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, Runtime } from '@/types/marketplace';

/*
 * "Connect" panel for listings that run on the ZenFlow runtime API (/api/v1).
 * Everything shown here is a real endpoint served by api/v1/router.js on this
 * deployment: the curl lines work as written once the buyer has a key.
 */

const FALLBACK_ORIGIN = 'https://zenflow-marketplace.vercel.app';

export function apiOrigin(): string {
  return typeof window !== 'undefined' && window.location?.origin?.startsWith('http') ? window.location.origin : FALLBACK_ORIGIN;
}

function exampleBody(p: Product, r: Runtime): string {
  switch (r.kind) {
    case 'llm-agent':
      return JSON.stringify({ input: p.inputs[0] ? `${p.inputs[0]}: …` : '…', model: 'claude' });
    case 'llm-bot':
      return JSON.stringify({ message: 'Hello', model: 'claude' });
    case 'n8n-workflow':
      return JSON.stringify({ [r.steps[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'input']: '…' });
    default:
      return '';
  }
}

export function curlFor(p: Product, origin = apiOrigin()): string {
  const r = p.runtime;
  if (!r) return '';
  if (r.kind === 'dataset') {
    const qs = r.params
      .filter((x) => x.required || x.example)
      .map((x) => `${x.name}=${encodeURIComponent(x.example)}`)
      .join('&');
    return `curl "${origin}${r.endpoint}${qs ? `?${qs}` : ''}" \\\n  -H "Authorization: Bearer $ZENFLOW_KEY"`;
  }
  return `curl -X POST "${origin}${r.endpoint}" \\\n  -H "Authorization: Bearer $ZENFLOW_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${exampleBody(p, r).replace(/'/g, "'\\''")}'`;
}

function CodeBlock({ code, label, testId }: { code: string; label: string; testId?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre
        data-testid={testId}
        className="overflow-x-auto rounded-[4px] border border-zf-grid bg-zf-canvas px-3 py-3 pr-12 font-mono text-[13px] leading-relaxed text-zf-text"
      >
        {code}
      </pre>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success(`Copied ${label}`);
          } catch {
            toast.error('Copy failed. Select the text instead.');
          }
        }}
        className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center rounded-[4px] text-zf-muted transition-colors duration-150 hover:bg-zf-raised hover:text-zf-text"
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

const ADAPTER_LABEL = { slack: 'Slack slash command', discord: 'Discord interactions', sms: 'Twilio SMS webhook' } as const;
const ADAPTER_QUERY = {
  slack: '?key=$ZENFLOW_KEY&signing_secret=$SLACK_SIGNING_SECRET',
  discord: '?key=$ZENFLOW_KEY&public_key=$DISCORD_PUBLIC_KEY',
  sms: '?key=$ZENFLOW_KEY&twilio_token=$TWILIO_AUTH_TOKEN',
} as const;

export default function ConnectPanel({ product: p }: { product: Product }) {
  const r = p.runtime;
  if (!r) return null;
  const origin = apiOrigin();
  const url = `${origin}${r.endpoint}`;

  if (p.pending) {
    return (
      <div data-testid="connect-pending" className="rounded-[4px] border border-zf-grid bg-zf-canvas px-3 py-3 text-sm text-zf-text">
        Held until {p.publisher} activates. The endpoint <code className="font-mono text-zf-muted">{r.method} {r.endpoint}</code> exists
        and answers <code className="font-mono">409 pending_activation</code> until then.
      </div>
    );
  }

  const webhookCurl = `curl -X POST "${origin}/api/v1/webhooks" \\\n  -H "Authorization: Bearer $ZENFLOW_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"asset_id":"${p.id}","url":"https://your-app.example/zenflow","events":["${r.kind === 'n8n-workflow' ? 'workflow.trigger' : 'run.completed'}"]}'`;

  return (
    <div className="space-y-5" data-testid="connect-panel">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-zf-muted">Endpoint</dt>
        <dd className="min-w-0 break-all font-mono text-zf-text" data-testid="connect-endpoint">
          <span className="text-zf-aegis">{r.method}</span> {url}
        </dd>
        <dt className="text-zf-muted">Auth</dt>
        <dd className="text-zf-text">
          <code className="font-mono">Authorization: Bearer zf_live_…</code>. Keys are issued when you rent; every call is written to
          your audit log (<code className="font-mono">GET /api/v1/runs</code>).
        </dd>
        {(r.kind === 'llm-agent' || r.kind === 'llm-bot') && (
          <>
            <dt className="text-zf-muted">Model</dt>
            <dd className="text-zf-text">
              <code className="font-mono">"model": "claude"</code> (Anthropic) or <code className="font-mono">"openai"</code>, per call.
            </dd>
          </>
        )}
        {r.kind === 'dataset' && (
          <>
            <dt className="text-zf-muted">Source</dt>
            <dd className="min-w-0 text-zf-text">
              <a href={r.source.url} rel="noopener" target="_blank" className="text-zf-blue-text underline-offset-2 hover:text-zf-text hover:underline">
                {r.source.name}
                <ExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <span className="block text-xs text-zf-muted">License: {r.source.license}</span>
            </dd>
            {r.key && (
              <>
                <dt className="text-zf-muted">Source key</dt>
                <dd className="text-zf-text">
                  Uses a free <code className="font-mono">{r.key}</code>. If the deployment has none, send your own as{' '}
                  <code className="font-mono">X-Source-Key</code>.
                </dd>
              </>
            )}
          </>
        )}
        {r.kind === 'n8n-workflow' && (
          <>
            <dt className="text-zf-muted">Trigger</dt>
            <dd className="text-zf-text">{r.trigger === 'schedule' ? 'Daily schedule in n8n' : 'Webhook'}</dd>
          </>
        )}
      </dl>

      {r.kind === 'dataset' && r.params.length > 0 && (
        <table className="w-full text-sm" data-testid="connect-params">
          <caption className="sr-only">Query parameters</caption>
          <thead>
            <tr className="border-b border-zf-grid text-left text-xs text-zf-muted">
              <th scope="col" className="py-1.5 pr-3 font-normal">Parameter</th>
              <th scope="col" className="py-1.5 pr-3 font-normal">Meaning</th>
              <th scope="col" className="py-1.5 font-normal">Example</th>
            </tr>
          </thead>
          <tbody>
            {r.params.map((x) => (
              <tr key={x.name} className="border-b border-zf-grid/60 last:border-0 align-top">
                <td className="py-2 pr-3 font-mono text-zf-text">
                  {x.name}
                  {x.required && <span className="text-zf-muted">*</span>}
                </td>
                <td className="py-2 pr-3 text-zf-muted">{x.description}</td>
                <td className="py-2 font-mono text-zf-text">{x.example || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div>
        <p className="mb-2 text-sm text-zf-muted">Call it</p>
        <CodeBlock code={curlFor(p, origin)} label="curl command" testId="connect-curl" />
      </div>

      {r.kind === 'n8n-workflow' && (
        <div className="space-y-2">
          <p className="text-sm text-zf-muted">
            Steps: <span className="text-zf-text">{r.steps.join(' → ')}</span>. Import the workflow into n8n, connect each app's
            credential there, then point a <code className="font-mono">workflow.trigger</code> webhook at its Webhook node.
          </p>
          <a
            href={`${origin}${r.n8n}`}
            download={`zenflow-${p.id}.n8n.json`}
            data-testid="connect-n8n"
            className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-zf-grid px-3 text-sm text-zf-text transition-colors duration-150 hover:bg-zf-raised"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download n8n workflow
          </a>
        </div>
      )}

      {r.kind === 'llm-bot' && r.adapters.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-zf-muted">Chat adapters</p>
          <ul className="space-y-2 text-sm" data-testid="connect-adapters">
            {r.adapters.map((a) => (
              <li key={a}>
                <span className="text-zf-text">{ADAPTER_LABEL[a]}</span>
                <code className="mt-1 block break-all font-mono text-xs text-zf-muted">
                  {url.replace(/\/chat$/, `/${a}`)}
                  {ADAPTER_QUERY[a]}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm text-zf-muted">
          {r.kind === 'n8n-workflow' ? 'Send triggers to your n8n' : 'Get a signed webhook after each run'} (HMAC-SHA256 in{' '}
          <code className="font-mono">ZenFlow-Signature</code>)
        </p>
        <CodeBlock code={webhookCurl} label="webhook command" testId="connect-webhook" />
      </div>

      <p className="text-xs text-zf-muted">
        Full reference:{' '}
        <a href={`${origin}/api/v1/openapi.json`} rel="noopener" className="text-zf-blue-text underline-offset-2 hover:underline">
          OpenAPI spec
        </a>
      </p>
    </div>
  );
}
