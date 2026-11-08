// Types for the canonical marks.js (copied verbatim from collective-ai-divisions build/logos.js).
export type MarkKey =
  | 'parent'
  | 'zenflow'
  | 'the-collective'
  | 'hybrid-living'
  | 'nexus-labs'
  | 'terra-axis'
  | 'binary-loom'
  | 'obsidian-arc'
  | 'kinetic-edge'
  | 'quantum-ledger'
  | 'juris-guard'
  | 'signal-velocity'
  | 'vital-helix';

export interface MarkDef {
  /** Tile gradient, light end. */
  t1: string;
  /** Tile gradient, deep end. */
  t2: string;
  /** Tile glow colour. */
  tg: string;
  /** Static SVG markup (64x64 viewBox, aria-hidden). */
  svg: string;
}

export const MARKS: Record<MarkKey, MarkDef>;
export function tile(key: MarkKey, size?: number, cls?: string): string;
export function tileFile(key: MarkKey): string;
