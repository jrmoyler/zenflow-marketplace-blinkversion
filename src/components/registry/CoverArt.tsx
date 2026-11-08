import type { ReactNode } from 'react';
import type { Product, ProductCategory } from '@/types/marketplace';
import { MARKS } from '@/brand/marks.js';
import { publisherSlug, type DivisionSlug } from '@/lib/network';
import { Mark } from '@/components/brand/Mark';
import { cn } from '@/lib/utils';

/*
 * Cover art for a listing. Static inline SVG (the CSP allows no remote images),
 * generated from the listing's own facts and seeded by a hash of its id, so the
 * same listing always draws the same picture and two listings never share one.
 *
 * Each category has its own ZenFlow motif, so the category reads from the art:
 *   agents      → neural lattice (nodes and edges around one core node)
 *   workflows   → agent threads (left-to-right decision DAG, one path taken)
 *   automations → orbital data rings (concentric rings, data points on them)
 *   bots        → signal waveforms (stacked message-like waveforms, in and out)
 *   databases   → orbital data rings, the same motif as automations (data at rest)
 *
 * Colour comes from the publisher: the division's locked mark colour for
 * division listings, ZenFlow silver with blue accents for open-source projects.
 * No text, no filters, no animation. Decorative: the card carries the words.
 */

export type CoverVariant = 'card' | 'sheet';

export interface CoverArtProps {
  product: Product;
  className?: string;
  variant?: CoverVariant;
}

export type Motif = 'lattice' | 'threads' | 'orbits' | 'waveform';

export const MOTIFS: Record<ProductCategory, Motif> = {
  agents: 'lattice',
  workflows: 'threads',
  automations: 'orbits',
  bots: 'waveform',
  databases: 'orbits',
};

interface Palette {
  key: DivisionSlug | 'vital-helix' | 'open-source';
  canvas: string;
  /** Main stroke and fill: the publisher's identity. */
  primary: string;
  /** Supporting lines and passive nodes. */
  accent: string;
  grid: string;
}

const SILVER = '#94A3B8';
const BLUE = '#3B82F6';

export function paletteFor(p: Pick<Product, 'publisher' | 'source'>): Palette {
  if (p.publisher === 'Vital Helix') {
    return { key: 'vital-helix', canvas: '#050810', primary: MARKS['vital-helix'].tg, accent: SILVER, grid: '#1E2235' };
  }
  const slug = p.source === 'open-source' ? null : publisherSlug(p.publisher);
  if (!slug) {
    return { key: 'open-source', canvas: '#0A0D1A', primary: SILVER, accent: BLUE, grid: '#1E2235' };
  }
  return { key: slug, canvas: '#050810', primary: MARKS[slug].tg, accent: SILVER, grid: '#1E2235' };
}

// ─── deterministic randomness ───────────────────────────────────────────────

/** FNV-1a, 32-bit. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small, fast, good enough for layout. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** One decimal keeps the markup short and stable. */
const f = (n: number) => Math.round(n * 10) / 10;

interface Frame {
  W: number;
  H: number;
  /** Bottom-left corner where the publisher mark sits; motifs keep clear of it. */
  inReserve: (x: number, y: number) => boolean;
}

// ─── motifs ─────────────────────────────────────────────────────────────────

interface Pt {
  x: number;
  y: number;
}

function lattice(p: Product, c: Palette, fr: Frame, rand: () => number): ReactNode {
  const { W, H } = fr;
  const n = clamp(4 + 2 * (p.capabilities.length + p.integrations.length), 8, 26);
  const core: Pt = { x: W * (0.56 + rand() * 0.16), y: H * (0.38 + rand() * 0.24) };
  const pts: Pt[] = [];
  const minD = Math.sqrt((W * H) / n) * 0.6;
  for (let i = 0; i < n; i++) {
    let best: Pt | null = null;
    for (let tries = 0; tries < 24; tries++) {
      const q = { x: 14 + rand() * (W - 28), y: 12 + rand() * (H - 24) };
      if (fr.inReserve(q.x, q.y)) continue;
      const near = [core, ...pts].some((o) => Math.hypot(o.x - q.x, o.y - q.y) < (o === core ? minD * 1.1 : minD));
      if (!near) {
        best = q;
        break;
      }
    }
    if (best) pts.push(best);
  }
  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const edges = new Set<string>();
  pts.forEach((a, i) => {
    pts
      .map((b, j) => ({ j, d: dist(a, b) }))
      .filter((o) => o.j !== i)
      .sort((x, y) => x.d - y.d)
      .slice(0, 2)
      .forEach(({ j }) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  const coreLinks = pts
    .map((b, j) => ({ j, d: dist(core, b) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, Math.min(5, pts.length))
    .map((o) => o.j);
  const linked = new Set(coreLinks);

  const mesh = [...edges]
    .map((e) => {
      const [i, j] = e.split('-').map(Number);
      return `M${f(pts[i].x)} ${f(pts[i].y)}L${f(pts[j].x)} ${f(pts[j].y)}`;
    })
    .join('');
  const spokes = coreLinks.map((j) => `M${f(core.x)} ${f(core.y)}L${f(pts[j].x)} ${f(pts[j].y)}`).join('');

  return (
    <g>
      <path d={mesh} stroke={c.accent} strokeOpacity={0.32} strokeWidth={0.8} fill="none" />
      <path d={spokes} stroke={c.primary} strokeOpacity={0.85} strokeWidth={1.2} fill="none" />
      {pts.map((q, i) => (
        <circle
          key={i}
          cx={f(q.x)}
          cy={f(q.y)}
          r={f(linked.has(i) ? 2.8 : 1.5 + rand() * 1.1)}
          fill={linked.has(i) ? c.primary : c.accent}
          fillOpacity={linked.has(i) ? 1 : 0.75}
        />
      ))}
      <circle cx={f(core.x)} cy={f(core.y)} r={17} stroke={c.primary} strokeOpacity={0.22} strokeDasharray="1 3" fill="none" />
      <circle cx={f(core.x)} cy={f(core.y)} r={10} stroke={c.primary} strokeOpacity={0.55} fill={c.canvas} />
      <circle cx={f(core.x)} cy={f(core.y)} r={5.5} fill={c.primary} />
    </g>
  );
}

function threads(p: Product, c: Palette, fr: Frame, rand: () => number): ReactNode {
  const { W, H } = fr;
  const mids = clamp(p.capabilities.length, 2, 4);
  const sizes = [
    clamp(p.inputs.length, 1, 4),
    ...Array.from({ length: mids }, (_, i) => (i === 0 ? 1 : 1 + Math.floor(rand() * 3))),
    clamp(p.outputs.length, 1, 4),
  ];
  const cols = sizes.length;
  const x0 = W * 0.09;
  const x1 = W * 0.91;
  const nodes: Pt[][] = sizes.map((k, ci) => {
    const x = x0 + ((x1 - x0) * ci) / (cols - 1);
    // The first column stays clear of the publisher mark in the bottom-left corner.
    const top = 22;
    const bottom = ci === 0 ? H - 64 : H - 26;
    const span = bottom - top;
    const jitter = (rand() - 0.5) * 10;
    return Array.from({ length: k }, (_, i) => ({
      x,
      y: k === 1 ? top + span * (0.35 + rand() * 0.3) : top + (span * i) / (k - 1) + jitter * (i % 2 ? 1 : -1) * 0.3,
    }));
  });

  // Every node gets at least one incoming edge; dangling nodes get one outgoing.
  const links: { a: [number, number]; b: [number, number] }[] = [];
  const has = (a: [number, number], b: [number, number]) =>
    links.some((l) => l.a[0] === a[0] && l.a[1] === a[1] && l.b[1] === b[1] && l.b[0] === b[0]);
  for (let ci = 1; ci < cols; ci++) {
    nodes[ci].forEach((_, ni) => {
      const from = Math.floor(rand() * nodes[ci - 1].length);
      links.push({ a: [ci - 1, from], b: [ci, ni] });
      if (rand() < 0.3 && nodes[ci - 1].length > 1) {
        const other = (from + 1) % nodes[ci - 1].length;
        if (!has([ci - 1, other], [ci, ni])) links.push({ a: [ci - 1, other], b: [ci, ni] });
      }
    });
    nodes[ci - 1].forEach((q, ni) => {
      if (!links.some((l) => l.a[0] === ci - 1 && l.a[1] === ni)) {
        const nearest = nodes[ci]
          .map((t, j) => ({ j, d: Math.abs(t.y - q.y) }))
          .sort((x, y) => x.d - y.d)[0].j;
        links.push({ a: [ci - 1, ni], b: [ci, nearest] });
      }
    });
  }

  // The path taken: one chain from an input to an output.
  const taken = new Set<number>();
  const onPath = new Set<string>();
  let cur = Math.floor(rand() * nodes[0].length);
  onPath.add(`0:${cur}`);
  for (let ci = 0; ci < cols - 1; ci++) {
    const outs = links.map((l, i) => ({ l, i })).filter(({ l }) => l.a[0] === ci && l.a[1] === cur);
    const pick = outs[Math.floor(rand() * outs.length)];
    taken.add(pick.i);
    cur = pick.l.b[1];
    onPath.add(`${ci + 1}:${cur}`);
  }

  // Orthogonal elbows with a small radius: a flow diagram, not a wave.
  const curve = (l: (typeof links)[number]) => {
    const a = nodes[l.a[0]][l.a[1]];
    const b = nodes[l.b[0]][l.b[1]];
    const mx = f(a.x + (b.x - a.x) * 0.5);
    const dy = b.y - a.y;
    if (Math.abs(dy) < 1) return `M${f(a.x)} ${f(a.y)}H${f(b.x)}`;
    const r = Math.min(6, Math.abs(dy) / 2);
    const sy = Math.sign(dy);
    return (
      `M${f(a.x)} ${f(a.y)}H${f(mx - r)}Q${mx} ${f(a.y)} ${mx} ${f(a.y + sy * r)}` +
      `V${f(b.y - sy * r)}Q${mx} ${f(b.y)} ${f(mx + r)} ${f(b.y)}H${f(b.x)}`
    );
  };
  const dim = links.filter((_, i) => !taken.has(i)).map(curve).join('');
  const lit = links.filter((_, i) => taken.has(i)).map(curve).join('');

  return (
    <g>
      <path d={dim} stroke={c.accent} strokeOpacity={0.38} strokeWidth={0.9} fill="none" />
      <path d={lit} stroke={c.primary} strokeWidth={1.6} fill="none" />
      {nodes.map((col, ci) =>
        col.map((q, ni) => {
          const isLit = onPath.has(`${ci}:${ni}`);
          const isEnd = ci === 0 || ci === cols - 1;
          const s = isEnd ? 4.5 : 5.5;
          const shape = isEnd
            ? `M${f(q.x - s)} ${f(q.y - s)}h${f(s * 2)}v${f(s * 2)}h${f(-s * 2)}Z`
            : `M${f(q.x)} ${f(q.y - s)}L${f(q.x + s)} ${f(q.y)}L${f(q.x)} ${f(q.y + s)}L${f(q.x - s)} ${f(q.y)}Z`;
          return (
            <path
              key={`${ci}-${ni}`}
              d={shape}
              fill={isLit ? c.primary : c.canvas}
              stroke={isLit ? c.primary : c.accent}
              strokeOpacity={isLit ? 1 : 0.7}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          );
        }),
      )}
    </g>
  );
}

function orbits(p: Product, c: Palette, fr: Frame, rand: () => number): ReactNode {
  const { W, H } = fr;
  const k = clamp(p.scopes.length + Math.ceil(p.integrations.length / 2), 2, 5);
  const cx = W * (0.6 + rand() * 0.08);
  const cy = H * (0.46 + rand() * 0.08);
  const rMin = H * 0.16;
  const rMax = H * 0.6;
  const rings = Array.from({ length: k }, (_, i) => rMin + ((rMax - rMin) * i) / Math.max(1, k - 1));
  const polar = (r: number, a: number): Pt => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  return (
    <g>
      {rings.map((r, i) => {
        const start = rand() * Math.PI * 2;
        const sweep = (0.25 + rand() * 0.35) * Math.PI * 2;
        const a = polar(r, start);
        const b = polar(r, start + sweep);
        const large = sweep > Math.PI ? 1 : 0;
        const dots = 1 + Math.floor(rand() * 3);
        return (
          <g key={i}>
            <circle cx={f(cx)} cy={f(cy)} r={f(r)} stroke={c.accent} strokeOpacity={0.26} fill="none" />
            <path
              d={`M${f(a.x)} ${f(a.y)}A${f(r)} ${f(r)} 0 ${large} 1 ${f(b.x)} ${f(b.y)}`}
              stroke={c.primary}
              strokeOpacity={0.95 - i * 0.08}
              strokeWidth={1.9}
              fill="none"
            />
            {/* The arc head: data arriving. */}
            <circle cx={f(b.x)} cy={f(b.y)} r={2.8} fill={c.primary} />
            {Array.from({ length: dots }, (_, d) => {
              const q = polar(r, start + sweep + (0.4 + rand() * 0.5) * Math.PI * ((d + 1) / dots));
              return <circle key={d} cx={f(q.x)} cy={f(q.y)} r={2.2} fill={c.accent} fillOpacity={0.85} />;
            })}
          </g>
        );
      })}
      <circle cx={f(cx)} cy={f(cy)} r={8} stroke={c.primary} strokeOpacity={0.5} fill={c.canvas} />
      <circle cx={f(cx)} cy={f(cy)} r={3.6} fill={c.primary} />
    </g>
  );
}

function waveform(p: Product, c: Palette, fr: Frame, rand: () => number): ReactNode {
  const { W, H } = fr;
  const rows = clamp(p.capabilities.length + 1, 3, 6);
  const top = 22;
  const bottom = H - 22;
  const rowH = (bottom - top) / rows;
  let outgoing = rand() < 0.5;

  return (
    <g>
      {Array.from({ length: rows }, (_, i) => {
        outgoing = !outgoing;
        const cy = top + rowH * (i + 0.5);
        const len = W * (0.34 + rand() * 0.3);
        const left = outgoing ? W - 22 - len : fr.inReserve(30, cy + rowH * 0.4) ? 64 : 30;
        const amp = rowH * (0.26 + rand() * 0.12);
        const freq = 5 + rand() * 7;
        const phase = rand() * Math.PI * 2;
        const h2 = 0.3 + rand() * 0.4;
        const steps = Math.max(12, Math.round(len / 2.5));
        let d = '';
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const env = Math.pow(Math.sin(Math.PI * t), 0.8);
          const y =
            cy + amp * env * (Math.sin(2 * Math.PI * freq * t + phase) * (1 - h2) + Math.sin(2 * Math.PI * freq * 2.3 * t) * h2);
          d += `${s === 0 ? 'M' : 'L'}${f(left + len * t)} ${f(y)}`;
        }
        const dotX = outgoing ? left + len + 7 : left - 7;
        return (
          <g key={i}>
            <path
              d={d}
              stroke={outgoing ? c.primary : c.accent}
              strokeOpacity={outgoing ? 1 : 0.7}
              strokeWidth={outgoing ? 1.4 : 1.1}
              fill="none"
            />
            <circle cx={f(dotX)} cy={f(cy)} r={2.4} fill={outgoing ? c.primary : c.accent} />
          </g>
        );
      })}
    </g>
  );
}

const DRAW: Record<Motif, (p: Product, c: Palette, fr: Frame, rand: () => number) => ReactNode> = {
  lattice,
  threads,
  orbits,
  waveform,
};

const SIZES: Record<CoverVariant, { W: number; H: number; mark: number; aspect: string }> = {
  card: { W: 320, H: 180, mark: 26, aspect: 'aspect-[16/9]' },
  sheet: { W: 480, H: 160, mark: 30, aspect: 'aspect-[3/1]' },
};

/** "{ }" block standing in for a division mark on open-source listings. */
function CodeGlyph({ size }: { size: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-[6px] border border-zf-grid bg-zf-raised"
      style={{ width: size, height: size }}
      data-mark="open-source"
    >
      <svg viewBox="0 0 24 24" width={size * 0.66} height={size * 0.66} fill="none" aria-hidden="true" focusable="false">
        <path
          d="M8.5 4.5C6.5 4.5 6.5 6 6.5 8s0 3-2 4c2 1 2 2 2 4s0 3.5 2 3.5M15.5 4.5c2 0 2 1.5 2 3.5s0 3 2 4c-2 1-2 2-2 4s0 3.5-2 3.5"
          stroke={SILVER}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={12} cy={12} r={1.4} fill={BLUE} />
      </svg>
    </span>
  );
}

export default function CoverArt({ product, className, variant = 'card' }: CoverArtProps) {
  const { W, H, mark, aspect } = SIZES[variant];
  const palette = paletteFor(product);
  const motif = MOTIFS[product.category];
  const rand = rng(hashString(`${product.id}:${variant}`));
  const reserveW = (mark + 28) * (W / 320);
  const frame: Frame = { W, H, inReserve: (x, y) => x < reserveW && y > H - reserveW };

  // Architecture grid: one path, every 32 units.
  let grid = '';
  for (let x = 32; x < W; x += 32) grid += `M${x} 0V${H}`;
  for (let y = 30; y < H; y += 30) grid += `M0 ${y}H${W}`;

  return (
    <div
      className={cn('relative overflow-hidden', aspect, className)}
      style={{ backgroundColor: palette.canvas }}
      role="presentation"
      aria-hidden="true"
      data-motif={motif}
      data-palette={palette.key}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
        strokeLinecap="round"
      >
        <rect width={W} height={H} fill={palette.canvas} />
        <path d={grid} stroke={palette.grid} strokeOpacity={0.55} strokeWidth={0.6} />
        {DRAW[motif](product, palette, frame, rand)}
      </svg>
      <span className="absolute bottom-2.5 left-2.5 flex">
        {palette.key === 'open-source' ? (
          <CodeGlyph size={mark} />
        ) : (
          <Mark division={palette.key} size={mark} title="" />
        )}
      </span>
    </div>
  );
}
