# ZenFlow Marketplace

The registry of agents, workflows, automations and bots that ZenFlow builds and the nine Collective AI divisions run. Every listing declares what it touches, what it refuses to do and when it hands off to a person, and carries an Aegis transparency score computed from those declarations.

Production: https://zenflow-marketplace.vercel.app (Vercel project `zenflow-marketplace`).

## Develop

```sh
npm install
npm run dev        # http://localhost:3000
npm run test:run   # vitest
npx tsc --noEmit   # types
npm run build      # dist/
```

## Where things live

| Path | What |
|---|---|
| `DESIGN.md` | Design DNA, constraint cards, tokens |
| `src/data/catalog.ts` | The hand-written catalog. Add listings here; `catalog.test.ts` enforces the invariants |
| `src/lib/registry.ts` | Filtering, sorting, facet counts, Aegis score, task matching |
| `src/lib/network.ts` | Links to collectiveai.info, the Start here hub, the division sites and the lead endpoint |
| `src/brand/marks.js` | Copy of `collective-ai-divisions/build/logos.js`, the canonical division marks. Edit it there, then copy it over |
| `src/hooks/useRegistryState.ts` | Filters and the open listing, synced to the URL |

## Leads

"Rent this agent" posts to the divisions hub's `/api/lead`, which forwards to the Airtable Inbound Lead Webhook as Division ZenFlow. The hub must list this site's origin in `LEAD_ALLOWED_ORIGINS`; until it does, the form falls back to a link to the ZenFlow start page.

Environment overrides are listed in `.env.example`.
