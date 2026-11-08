import type { CSSProperties } from 'react';
import { MARKS, type MarkKey } from '@/brand/marks.js';
import { DIVISIONS } from '@/lib/network';
import { cn } from '@/lib/utils';

/*
 * The official Collective AI marks (src/brand/marks.js, a verbatim copy of
 * collective-ai-divisions build/logos.js) on the official tactile tile
 * (`.zf-tile` in index.css, ported from that repo's assets/core.css `.tile`).
 * Do not redraw marks here: change them upstream and copy logos.js over.
 */

const NAMES: Record<MarkKey, string> = {
  parent: 'Collective AI',
  ...(Object.fromEntries(DIVISIONS.map((d) => [d.slug, d.name])) as Record<Exclude<MarkKey, 'parent' | 'vital-helix'>, string>),
  'vital-helix': 'Vital Helix',
};

export interface MarkProps {
  /** Tile width and height in px. */
  size?: number;
  className?: string;
  /** Accessible name. Defaults to the division name; pass an empty string to mark it decorative. */
  title?: string;
  /** Which mark to render. Any key of MARKS; defaults to ZenFlow. */
  division?: MarkKey;
}

export function Mark({ size = 32, className, title, division = 'zenflow' }: MarkProps) {
  const m = MARKS[division] ?? MARKS.zenflow;
  const label = title ?? NAMES[division] ?? 'ZenFlow';
  const decorative = label === '';
  const style = { '--sz': `${size}px`, '--t1': m.t1, '--t2': m.t2, '--tg': m.tg } as CSSProperties;

  return (
    <span
      className={cn('zf-tile', className)}
      style={style}
      data-mark={division}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      // Safe: m.svg is a static string constant from our own repo (src/brand/marks.js), never user input.
      dangerouslySetInnerHTML={{ __html: m.svg }}
    />
  );
}

export interface WordmarkProps {
  /** Size of the mark tile in px. */
  markSize?: number;
  className?: string;
  /** Show the muted "Marketplace" label after the name. */
  showLabel?: boolean;
  /** Extra classes for the label, e.g. to hide it on narrow screens. */
  labelClassName?: string;
}

export function Wordmark({ markSize = 32, className, showLabel = true, labelClassName }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Mark size={markSize} title="" />
      <span className="text-[17px] font-bold leading-none tracking-tight text-zf-text">ZenFlow</span>
      {showLabel && (
        <span className={cn('text-sm font-medium leading-none text-zf-muted', labelClassName)}>Marketplace</span>
      )}
    </span>
  );
}

export default Mark;
