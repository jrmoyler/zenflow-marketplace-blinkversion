# ZenFlow Marketplace — Design DNA

Tier **L** (flagship rebuild). Target: repo / deployed Vite SPA. Brand lock: **ZenFlow division** (`zenflow-division`), under the Collective AI parent.

## What this is

The registry where Collective AI's departments publish the agents, workflows, automations and bots they run on Zenith OS. Internal validation comes first: every listing names the department that publishes it and where it is deployed. Buyers are developers, operators and technically literate founders who need to know three things before installing anything: what it does, what it touches, and what it refuses to do.

## Direction: "The Registry"

A package index crossed with a lab instrument panel. Dense, legible, sortable. The product is the catalog, so the catalog is the hero — not a slogan.

Runner-up ("Neural Showroom": full-bleed lattice canvas, big cards, scroll storytelling) loses because it puts decoration between the buyer and the information they came for, and it is the same showroom grammar the old build had.

## Tokens (locked by zenflow-division)

| Role | Token | Value | Weight |
|---|---|---|---|
| Canvas | `--zf-canvas` | `#050810` Neural Black | 60% |
| Surface | `--zf-surface` | `#0A0D1A` Deep Void | 30% |
| Surface raised | `--zf-raised` | `#0F1220` | 30% variant |
| Grid / border | `--zf-grid` | `#1E2235` | — |
| Primary accent | `--zf-violet` | `#7C3AED` (text use: `#A78BFA` for AA contrast) | 10% |
| Data accent | `--zf-blue` | `#3B82F6` (text/links: `#60A5FA`) | 10% |
| Text | `--zf-text` | `#F8FAFC` | — |
| Text muted | `--zf-muted` | `#94A3B8` | — |
| Aegis | `--zf-aegis` | `#D4A843` — governance indicators **only** | — |

No green anywhere (Gaia Synthesis territory). No amber outside Aegis.

Type: Space Grotesk 400/500/700 (brand-locked). JetBrains Mono 400/500 **only for real data**: listing IDs (`zf/agent/ledger-reconciler`), versions, prices, counts, scores. Never for decorative eyebrow labels.

Radius by function: 4px on data rows, chips, inputs; 8px on cards and panels; 12px on the detail sheet. No `rounded-2xl`/`rounded-3xl`.

## Constraint cards

- **Banned:** aurora/radial blob backgrounds, glassmorphism on cards, glow box-shadows, gradient text, `hover:scale-*` on cards, bento grids, "Next-Gen" / "Revolutionize" / "Supercharge" copy, star ratings and sales counts (we have no real reviews — fabricated social proof), placeholder images, emoji, fake typing "AI" responses, stat counters.
- **Allowed with a job:** backdrop blur on the sticky nav and the detail sheet overlay (real layering). One violet radial behind the hero lattice (brand spec, guides the eye to the search field). The neural lattice motif — drawn from actual catalog data, not random.
- **Committed signature:** the **Aegis readout** — every listing carries a transparency score (0–100) computed from declared facts (data scopes, refusals, escalation, audit log, human-in-loop), rendered as a gold instrument bar with the rubric one click away. It replaces stars.

## Layout

1. Sticky nav: wordmark, registry search (⌘K / `/`), category tabs, "Find by task".
2. Hero (left-aligned, asymmetric): one sentence of what the registry is, the search field, live counts from the catalog; right side the lattice SVG — one node per listing, clustered by category.
3. Registry: facet sidebar (category, pricing model, data scopes touched, min Aegis score, publisher) with counts + results list (rows on desktop, cards on mobile), sort (Aegis, price, recently updated, name). Discovery and search are the same view — no "Back to Discovery" mode switch.
4. Detail sheet: ID + version, one-liner, who it's for, capabilities, inputs → outputs, integrations, Aegis report (refusals, escalation triggers, data scopes, rubric breakdown), pricing, changelog, install command with copy.
5. Footer: real links only, computed year, honest status line ("Catalog in internal validation. Pricing provisional.").

## Motion

Motion marks hierarchy: sheet slide-in (220ms, ease-out), lattice node highlight when a filter changes, nothing on scroll. All motion disabled under `prefers-reduced-motion`.

## States to design

Empty results (with the active filters named and one-click removal), no-match in task finder, copy-success, keyboard focus rings (2px `--zf-blue`), loading not needed (static catalog).
