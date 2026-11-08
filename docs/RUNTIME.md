# ZenFlow runtime API (`/api/v1`)

Every listing from the ZenFlow Master Inventory runs on this API. It is served by
`api/v1/router.js` (one Vercel function; `vercel.json` rewrites `/api/v1/*` to it).

| What | Endpoint |
|---|---|
| Run an agent | `POST /api/v1/agents/:id/run` `{ input, context?, model: "claude"\|"openai" }` |
| Chat with a bot | `POST /api/v1/bots/:id/chat` `{ message \| messages[] , model? }` |
| Bot in Slack / Discord / SMS | `POST /api/v1/bots/:id/slack` · `/discord` · `/sms` (key in `?key=`) |
| Trigger a workflow | `POST /api/v1/workflows/:id/trigger` → forwarded to the buyer's `workflow.trigger` webhooks |
| Import a workflow into n8n | `GET /api/v1/workflows/:id/n8n.json` |
| One workflow step (used by n8n) | `POST /api/v1/tasks/run` `{ workflow, step, input }` |
| Query a database | `GET /api/v1/databases/:id?…params` |
| Webhooks | `GET/POST /api/v1/webhooks`, `DELETE /api/v1/webhooks/:id` |
| Audit log | `GET /api/v1/runs` |
| Issue a key (admin) | `POST /api/v1/keys` with `X-Admin-Token` |
| Discovery | `GET /api/v1/health`, `/api/v1/assets[/:id]`, `/api/v1/openapi.json` |

Auth: `Authorization: Bearer zf_live_…`. Keys, the run log and webhook subscriptions live in the
`collective-ai-vault` Supabase project (`zf_*` tables, RLS on, reached only through
`SECURITY DEFINER` functions that check the key). Only key hashes are stored.

Webhooks are signed: `ZenFlow-Signature: t=<unix>,v1=<hex>` where `v1 = HMAC-SHA256(secret, "<t>.<raw body>")`.

Every run is written to the audit log; if the log is unavailable (`ZF_SERVER_TOKEN` unset) runs are refused with 503.
Pending (Vital Helix) listings answer `409 pending_activation`.

## Environment variables (Vercel → Project → Settings → Environment Variables)

Required for runs: `ZF_SERVER_TOKEN`, and at least one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`.

Free source keys (databases answer `503 source_key_not_configured` without them, or the buyer can send `X-Source-Key`):
`CENSUS_API_KEY`, `EIA_API_KEY`, `NASS_API_KEY`, `YOUTUBE_API_KEY`, `META_ACCESS_TOKEN`, `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET`,
`REBRICKABLE_API_KEY`, `PATENTSVIEW_API_KEY`, `COURTLISTENER_TOKEN`, `NVD_API_KEY`.
Optional (raise rate limits): `DATA_GOV_API_KEY`, `NREL_API_KEY`, `GITHUB_TOKEN`, `NCBI_API_KEY`, `SEC_USER_AGENT`.
Optional model overrides: `ZF_CLAUDE_MODEL`, `ZF_OPENAI_MODEL`, `ZF_DEFAULT_MODEL`.

## Database connector status (probed live 2026-11-08)

- 68 of 100 returned real rows.
- 18 need one of the free source keys above (connector code ran up to the key check).
- 4 could not be reached from the test sandbox's network (Wayback Machine, Stack Exchange, NREL ×2); they are expected to work from Vercel.
- 10 depend on upstream services that were slow or rate-limited during the test. OpenFEMA, NYC Open Data and Blockscout returned rows in an earlier run and timed out in the last one; GitHub hit the shared-IP limit (set `GITHUB_TOKEN`); GDELT ×3 and Overpass ×3 did not answer through the sandbox proxy and still need checking from Vercel. Failures come back as `502 source_error` with the upstream status.
