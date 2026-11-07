import { useId } from 'react';
import { cn } from '@/lib/utils';

/*
 * ZenFlow mark — per the zenflow-division brand spec.
 * Geometry on a 64-unit grid: disc centred at (29,29), r=25; outer ring r=27.5;
 * the yin-yang S-curve is two r=12.5 semicircle arcs. The 4-point star sits in
 * the free lower-right corner.
 */

const CX = 29;
const R = 25;
const TOP = CX - R; // 4
const BOTTOM = CX + R; // 54
const HALF = R / 2; // 12.5

// Light (yang) half: right side, indented at the top, bulging into the lower left.
const YANG_PATH = [
  `M${CX} ${TOP}`,
  `A${R} ${R} 0 0 1 ${CX} ${BOTTOM}`,
  `A${HALF} ${HALF} 0 0 1 ${CX} ${CX}`,
  `A${HALF} ${HALF} 0 0 0 ${CX} ${TOP}`,
  'Z',
].join(' ');

const VIOLET = '#7C3AED';
const BLUE = '#3B82F6';

type Node = { x: number; y: number; c: string };

// Five nodes that stay legible at 24px. All sit inside the yang half.
const CORE_NODES: Node[] = [
  { x: 44, y: 18, c: BLUE },
  { x: 48, y: 32, c: VIOLET },
  { x: 35, y: 37, c: BLUE },
  { x: 41, y: 45, c: VIOLET },
  { x: 23, y: 46, c: BLUE },
];
const CORE_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 4],
];

// Extra lattice detail drawn only at larger sizes.
const DETAIL_NODES: Node[] = [
  { x: 50, y: 23, c: VIOLET },
  { x: 31, y: 50, c: VIOLET },
  { x: 47, y: 41, c: BLUE },
];
// Indices continue after CORE_NODES (5, 6, 7).
const DETAIL_EDGES: [number, number][] = [
  [0, 5],
  [5, 1],
  [4, 6],
  [6, 3],
  [1, 7],
  [7, 3],
];

const STAR_PATH = 'M56 49 L57.5 54.5 L63 56 L57.5 57.5 L56 63 L54.5 57.5 L49 56 L54.5 54.5 Z';

export interface MarkProps {
  /** Rendered width and height in px. Lattice detail increases at 40px and up. */
  size?: number;
  className?: string;
  /** Accessible name. Pass an empty string to mark the SVG decorative. */
  title?: string;
}

export function Mark({ size = 32, className, title = 'ZenFlow' }: MarkProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `zf-yang-${uid}`;
  const titleId = `zf-mark-title-${uid}`;
  const detailed = size >= 40;
  const nodes = detailed ? [...CORE_NODES, ...DETAIL_NODES] : CORE_NODES;
  const edges = detailed ? [...CORE_EDGES, ...DETAIL_EDGES] : CORE_EDGES;
  const nodeR = detailed ? 2 : 2.6;
  const decorative = title === '';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : titleId}
      focusable="false"
    >
      {!decorative && <title id={titleId}>{title}</title>}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0.3" stopColor="#1E1065" />
          <stop offset="1" stopColor="#0A0D1A" />
        </linearGradient>
      </defs>
      {/* Yin half: Neural Black disc, borderless against the canvas. */}
      <circle cx={CX} cy={CX} r={R} fill="#050810" />
      <path d={YANG_PATH} fill={`url(#${gradId})`} />
      <g stroke={VIOLET} strokeOpacity={0.6} strokeWidth={detailed ? 1 : 1.4} strokeLinecap="round">
        {edges.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
      </g>
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={nodeR} fill={n.c} />
      ))}
      <circle cx={CX} cy={CX} r={27.5} fill="none" stroke={BLUE} strokeOpacity={0.6} strokeWidth={2} />
      <path d={STAR_PATH} fill="#A78BFA" />
    </svg>
  );
}

export interface WordmarkProps {
  /** Size of the mark in px. */
  markSize?: number;
  className?: string;
  /** Show the muted "Marketplace" label after the name. */
  showLabel?: boolean;
  /** Extra classes for the label, e.g. to hide it on narrow screens. */
  labelClassName?: string;
}

export function Wordmark({ markSize = 24, className, showLabel = true, labelClassName }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Mark size={markSize} title="" />
      <span className="text-[17px] font-bold leading-none tracking-tight text-zf-text">ZenFlow</span>
      {showLabel && (
        <span className={cn('text-sm font-medium leading-none text-zf-muted', labelClassName)}>Marketplace</span>
      )}
    </span>
  );
}

export default Mark;
