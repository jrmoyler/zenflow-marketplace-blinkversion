/**
 * Lattice — the registry drawn as a neural lattice.
 *
 * One node per listing, clustered by category. Node radius follows the Aegis
 * score; listings with no Aegis assessment (open-source projects) are drawn as
 * small hollow rings so they never read as scored. Lines join listings that
 * share an integration. Layout is a pure,
 * deterministic function of the catalog (no Math.random), so the same catalog
 * always draws the same picture, whatever order the listings arrive in.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Product, ProductCategory } from '../../types/marketplace';
import { CATEGORIES, aegisScore, registryId } from '../../lib/registry';
import { cn } from '../../lib/utils';

export const LATTICE_W = 520;
export const LATTICE_H = 380;

/** Fill per category. Violet and blue for the two primary kinds, tints for the rest. */
export const CATEGORY_FILL: Record<ProductCategory, string> = {
  agents: '#7C3AED',
  workflows: '#3B82F6',
  automations: '#A78BFA',
  bots: '#93C5FD',
};

/** Cluster centres, deliberately off-grid so the lattice does not read as a 2x2 table. */
const CLUSTER_CENTRES: Record<ProductCategory, { x: number; y: number; labelSide: 'top' | 'bottom' }> = {
  agents: { x: 122, y: 132, labelSide: 'top' },
  workflows: { x: 398, y: 108, labelSide: 'top' },
  automations: { x: 404, y: 276, labelSide: 'bottom' },
  bots: { x: 136, y: 286, labelSide: 'bottom' },
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MAX_CLUSTER_RADIUS = 84;
const MAX_DEGREE = 4;
/** Fixed radius for unassessed listings: no score, so size carries no meaning. */
export const UNASSESSED_RADIUS = 2.75;
/** Room kept between a node centre and the viewBox edge (x) / edge band (y). */
const EDGE_X = 14;
const EDGE_Y = 30;
/** Label height plus gap, so a cluster never runs into its own label. */
const LABEL_ROOM = 36;

export interface LatticeNode {
  id: string;
  product: Product;
  category: ProductCategory;
  x: number;
  y: number;
  r: number;
  /** null when the listing has not been assessed. */
  score: number | null;
}

export interface LatticeEdge {
  key: string;
  a: string;
  b: string;
  /** Number of integrations the two listings share. */
  weight: number;
  d: string;
  /** Joins two different categories (drawn bowed and quieter). */
  cross: boolean;
}

export interface LatticeCluster {
  category: ProductCategory;
  label: string;
  count: number;
  x: number;
  y: number;
  radius: number;
  labelX: number;
  labelY: number;
}

export interface LatticeLayout {
  nodes: LatticeNode[];
  edges: LatticeEdge[];
  clusters: LatticeCluster[];
}

/** FNV-1a 32-bit hash mapped to [0, 1). */
export function hash01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Radius for an assessed listing; `scale` (0–1) shrinks every node in a dense cluster. */
export function nodeRadius(score: number, scale = 1): number {
  return round((3 + (clamp(score, 0, 100) / 100) * 5) * scale);
}

/**
 * Largest spiral radius a cluster can use without leaving the viewBox or running
 * into its own category label (above for top clusters, below for bottom ones).
 */
function fitRadius(c: { x: number; y: number; labelSide: 'top' | 'bottom' }): number {
  const top = c.labelSide === 'top' ? c.y - LABEL_ROOM : c.y - EDGE_Y;
  const bottom = c.labelSide === 'bottom' ? LATTICE_H - LABEL_ROOM - c.y : LATTICE_H - EDGE_Y - c.y;
  return Math.min(MAX_CLUSTER_RADIUS, c.x - EDGE_X, LATTICE_W - EDGE_X - c.x, top, bottom);
}

/**
 * Pure layout. Within each category the listings sit on a Vogel (sunflower)
 * spiral, highest Aegis score at the centre; each node gets a small jitter
 * from a hash of its id so the spiral does not look machined. The spiral's
 * spacing shrinks as a cluster grows, so the outermost node plus its jitter
 * stays inside the cluster's fit radius for any size (tested to ~130 listings);
 * once spacing gets tight, node radii shrink with it so nodes do not pile up.
 * Unassessed listings sort after every assessed one, on the outer rings.
 */
export function computeLattice(products: Product[]): LatticeLayout {
  const nodes: LatticeNode[] = [];
  const clusters: LatticeCluster[] = [];

  for (const cat of CATEGORIES) {
    const centre = CLUSTER_CENTRES[cat.id];
    const members = products
      .filter((p) => p.category === cat.id)
      .map((p) => ({ p, score: aegisScore(p) }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.p.id.localeCompare(b.p.id));

    const n = members.length;
    const JITTER = 0.22;
    // Outermost node sits at spacing * sqrt(n - 0.65), plus up to JITTER * spacing.
    const spacing = n > 1 ? Math.min(21, fitRadius(centre) / (Math.sqrt(n - 0.65) + JITTER)) : n === 1 ? 21 : 0;
    const scale = clamp(spacing / 16, 0.45, 1);
    const rotation = hash01(cat.id) * Math.PI * 2;
    let radius = 0;

    members.forEach(({ p, score }, i) => {
      const h1 = hash01(p.id);
      const h2 = hash01(`${p.id}:y`);
      const rr = spacing * Math.sqrt(i + (i === 0 ? 0 : 0.35));
      const theta = rotation + i * GOLDEN_ANGLE;
      const jitter = n > 1 ? spacing * JITTER : 0;
      const x = clamp(centre.x + rr * Math.cos(theta) + (h1 - 0.5) * 2 * jitter, EDGE_X, LATTICE_W - EDGE_X);
      const y = clamp(centre.y + rr * Math.sin(theta) + (h2 - 0.5) * 2 * jitter, EDGE_Y, LATTICE_H - EDGE_Y);
      radius = Math.max(radius, Math.hypot(x - centre.x, y - centre.y));
      const r = score === null ? UNASSESSED_RADIUS : nodeRadius(score, scale);
      nodes.push({ id: p.id, product: p, category: cat.id, x: round(x), y: round(y), r, score });
    });

    const pad = radius + 18;
    clusters.push({
      category: cat.id,
      label: cat.label,
      count: n,
      x: centre.x,
      y: centre.y,
      radius: round(radius),
      labelX: centre.x,
      labelY: round(
        centre.labelSide === 'top' ? clamp(centre.y - pad, 18, LATTICE_H) : clamp(centre.y + pad + 10, 0, LATTICE_H - 8),
      ),
    });
  }

  return { nodes, edges: computeEdges(nodes), clusters };
}

function computeEdges(nodes: LatticeNode[]): LatticeEdge[] {
  const cap = Math.round(nodes.length * 1.5);
  if (nodes.length < 2 || cap === 0) return [];

  const sets = nodes.map((n) => new Set(n.product.integrations.map((s) => s.toLowerCase())));
  const candidates: { i: number; j: number; weight: number; key: string; tie: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let weight = 0;
      for (const s of sets[i]) if (sets[j].has(s)) weight += 1;
      if (weight === 0) continue;
      const [a, b] = [nodes[i].id, nodes[j].id].sort();
      const key = `${a}--${b}`;
      candidates.push({ i, j, weight, key, tie: hash01(key) });
    }
  }
  candidates.sort((x, y) => y.weight - x.weight || x.tie - y.tie || x.key.localeCompare(y.key));

  // Threads between categories are the interesting ones but turn into a hairball fast:
  // they get at most a third of the edge budget, the rest goes to links inside a cluster.
  const crossCap = Math.ceil(cap / 3);
  let crossCount = 0;
  const degree = new Map<string, number>();
  const cx = LATTICE_W / 2;
  const cy = LATTICE_H / 2;
  const edges: LatticeEdge[] = [];
  for (const c of candidates) {
    if (edges.length >= cap) break;
    const A = nodes[c.i];
    const B = nodes[c.j];
    const cross = A.category !== B.category;
    if (cross && crossCount >= crossCap) continue;
    if ((degree.get(A.id) ?? 0) >= MAX_DEGREE || (degree.get(B.id) ?? 0) >= MAX_DEGREE) continue;
    if (cross) crossCount += 1;
    degree.set(A.id, (degree.get(A.id) ?? 0) + 1);
    degree.set(B.id, (degree.get(B.id) ?? 0) + 1);

    const [from, to] = A.id < B.id ? [A, B] : [B, A];
    let d: string;
    if (!cross) {
      d = `M${from.x} ${from.y}L${to.x} ${to.y}`;
    } else {
      // Bow cross-category lines toward the middle so they read as threads, not a mesh.
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const qx = round(mx + (cx - mx) * 0.35);
      const qy = round(my + (cy - my) * 0.35);
      d = `M${from.x} ${from.y}Q${qx} ${qy} ${to.x} ${to.y}`;
    }
    edges.push({ key: c.key, a: from.id, b: to.id, weight: c.weight, d, cross });
  }
  return edges;
}

export interface LatticeProps {
  products: Product[];
  highlightIds?: Set<string>;
  activeCategories?: ProductCategory[];
  onSelectCategory?: (c: ProductCategory) => void;
  onSelectProduct?: (p: Product) => void;
  className?: string;
}

function activateOnKey(e: KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
}

const PULSE_COUNT = 5;
const PULSE_SLOT = 5; // seconds between pulses; one pulse in flight at a time
const PULSE_DURATION = 2.6;

export default function Lattice({
  products,
  highlightIds,
  activeCategories = [],
  onSelectCategory,
  onSelectProduct,
  className,
}: LatticeProps) {
  const reduceMotion = useReducedMotion();
  const layout = useMemo(() => computeLattice(products), [products]);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusCat, setFocusCat] = useState<ProductCategory | null>(null);

  const isLit = (id: string) => !highlightIds || highlightIds.has(id);
  const activeId = focusId ?? hoverId;
  const active = activeId ? layout.nodes.find((n) => n.id === activeId) : undefined;
  const pulses = reduceMotion || highlightIds ? [] : layout.edges.slice(0, PULSE_COUNT);

  return (
    <div className={cn('flex min-w-0 flex-col', className)}>
      <svg
        viewBox={`0 0 ${LATTICE_W} ${LATTICE_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block min-h-0 w-full flex-1 overflow-visible"
        role="group"
        aria-label={`Registry lattice: ${products.length} listings grouped by category, joined where they share an integration`}
      >
        <g aria-hidden="true" fill="none" strokeLinecap="round">
          {layout.edges.map((e) => {
            const lit = isLit(e.a) && isLit(e.b);
            const base = (e.cross ? 0.16 : 0.42) + (e.weight > 1 ? 0.14 : 0);
            return (
              <path
                key={e.key}
                d={e.d}
                stroke="#3B82F6"
                strokeWidth={e.weight > 1 ? 1.1 : 0.7}
                style={{ opacity: lit ? base : 0.05, transition: 'opacity 200ms ease-out' }}
              />
            );
          })}
          {pulses.map((e, i) => (
            <motion.path
              key={`pulse-${e.key}`}
              d={e.d}
              stroke="#A78BFA"
              strokeWidth={1.6}
              pathLength={1}
              strokeDasharray="0.08 1"
              initial={{ strokeDashoffset: 0.08 }}
              animate={{ strokeDashoffset: -1 }}
              transition={{
                duration: PULSE_DURATION,
                ease: 'easeInOut',
                delay: 1.2 + i * PULSE_SLOT,
                repeat: Infinity,
                repeatDelay: PULSE_COUNT * PULSE_SLOT - PULSE_DURATION,
              }}
            />
          ))}
        </g>

        {layout.clusters.map((c) => {
          const pressed = activeCategories.includes(c.category);
          const textW = c.label.length * 9.6 + String(c.count).length * 8.6 + 16;
          return (
            <g key={c.category}>
              <g
                role="button"
                tabIndex={0}
                aria-pressed={pressed}
                aria-label={`${c.label}, ${c.count} listing${c.count === 1 ? '' : 's'}. Filter the registry by ${c.label.toLowerCase()}`}
                data-category={c.category}
                className="cursor-pointer outline-none"
                onClick={() => onSelectCategory?.(c.category)}
                onKeyDown={(e) => activateOnKey(e, () => onSelectCategory?.(c.category))}
                onFocus={() => setFocusCat(c.category)}
                onBlur={() => setFocusCat(null)}
              >
                <rect
                  x={c.labelX - textW / 2 - 6}
                  y={c.labelY - 17}
                  width={textW + 12}
                  height={24}
                  rx={4}
                  fill={pressed ? 'rgba(124,58,237,0.18)' : 'transparent'}
                  stroke={focusCat === c.category ? '#3B82F6' : pressed ? 'rgba(167,139,250,0.55)' : 'transparent'}
                  strokeWidth={focusCat === c.category ? 2 : 1}
                />
                <text
                  x={c.labelX}
                  y={c.labelY}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={500}
                  fill={pressed ? '#F8FAFC' : '#94A3B8'}
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {c.label}
                  <tspan dx={6} fill={CATEGORY_FILL[c.category]} style={{ fontFamily: 'var(--font-mono)' }} fontSize={13}>
                    {c.count}
                  </tspan>
                </text>
              </g>

              {layout.nodes
                .filter((n) => n.category === c.category)
                .map((n) => {
                  const lit = isLit(n.id);
                  const isActive = activeId === n.id;
                  const assessed = n.score !== null;
                  return (
                    <g
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      data-node-id={n.id}
                      data-x={n.x}
                      data-y={n.y}
                      data-assessed={assessed ? 'true' : 'false'}
                      aria-label={`${n.product.title}, ${registryId(n.product)}, ${assessed ? `Aegis ${n.score}` : 'not assessed'}. Open details`}
                      className="cursor-pointer outline-none"
                      style={{ opacity: lit ? 1 : 0.2, transition: 'opacity 200ms ease-out' }}
                      onClick={() => onSelectProduct?.(n.product)}
                      onKeyDown={(e) => activateOnKey(e, () => onSelectProduct?.(n.product))}
                      onMouseEnter={() => setHoverId(n.id)}
                      onMouseLeave={() => setHoverId((h) => (h === n.id ? null : h))}
                      onFocus={() => setFocusId(n.id)}
                      onBlur={() => setFocusId((f) => (f === n.id ? null : f))}
                    >
                      <title>{n.product.title}</title>
                      {/* Larger invisible hit area so small nodes are easy to tap. */}
                      <circle cx={n.x} cy={n.y} r={Math.max(n.r + 4, 9)} fill="transparent" />
                      {assessed ? (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={n.r}
                          fill={CATEGORY_FILL[n.category]}
                          stroke={isActive ? '#F8FAFC' : '#050810'}
                          strokeWidth={isActive ? 1.5 : 1}
                        />
                      ) : (
                        // Hollow ring: stroke only, so an unscored listing never reads as a small score.
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={n.r}
                          fill="none"
                          data-hollow="true"
                          stroke={isActive ? '#F8FAFC' : CATEGORY_FILL[n.category]}
                          strokeWidth={isActive ? 1.5 : 1.1}
                        />
                      )}
                      {focusId === n.id && (
                        <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke="#3B82F6" strokeWidth={2} />
                      )}
                    </g>
                  );
                })}
            </g>
          );
        })}
      </svg>

      <p
        aria-hidden="true"
        className="mt-2 flex h-5 min-w-0 items-baseline gap-3 overflow-hidden whitespace-nowrap text-xs text-zf-muted"
      >
        {active ? (
          <>
            <span className="truncate text-zf-text">{active.product.title}</span>
            <span className="hidden font-mono sm:inline">{registryId(active.product)}</span>
            {active.score !== null ? (
              <span className="font-mono text-zf-aegis">Aegis {active.score}</span>
            ) : (
              <span>Not assessed</span>
            )}
          </>
        ) : (
          <span className="truncate">
            Node size is the Aegis score; hollow rings are not assessed; lines are shared integrations.
          </span>
        )}
      </p>
    </div>
  );
}
