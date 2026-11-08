import type { Publisher } from '@/types/marketplace';

/*
 * One place for every outbound link to the Collective AI network.
 * Mirrors collective-ai-divisions build/registry.js (DIVISIONS, HUB_URL, MAIN_URL,
 * ASSESSMENT_URL) and collectiveai site/index.src.html window.__SITE__.
 * Each URL can be overridden at build time with a VITE_* variable (see .env.example).
 */

type Env = Record<string, string | boolean | undefined>;

const env: Env = (import.meta as unknown as { env?: Env }).env ?? {};

/** Use an override when it is a non-empty string, else the default. */
export function pick(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

const stripSlash = (url: string) => url.replace(/\/+$/, '');

/** The main Collective AI site. */
export const MAIN_URL = pick(env.VITE_MAIN_URL, 'https://collectiveai-roan.vercel.app/');
/** The "Start here" link hub (repo Collective-AI-start). */
export const HUB_URL = pick(env.VITE_HUB_URL, 'https://collective-ai-start.vercel.app/');
/** The free AI Readiness Audit. */
export const ASSESSMENT_URL = pick(env.VITE_ASSESSMENT_URL, 'https://the-collective-ai-assessment-platfo.vercel.app/');
/** Base of the eleven division sites, no trailing slash. */
export const DIVISIONS_URL = stripSlash(pick(env.VITE_DIVISIONS_URL, 'https://collective-ai-divisions-brown.vercel.app'));
/** Shared lead handler (collective-ai-divisions api/lead.js, forwards to Airtable). */
export const LEAD_ENDPOINT = pick(env.VITE_LEAD_ENDPOINT, `${DIVISIONS_URL}/api/lead`);

export type DivisionSlug =
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
  | 'signal-velocity';

export interface Division {
  slug: DivisionSlug;
  name: Publisher;
  role: string;
  /** Locked primary accent (June 2026 color lock). */
  chip: string;
}

/** The eleven active divisions, in charter order. Same data as build/registry.js. */
export const DIVISIONS: readonly Division[] = [
  { slug: 'zenflow', name: 'ZenFlow', chip: '#7C3AED', role: 'Agent infrastructure' },
  { slug: 'the-collective', name: 'The Collective', chip: '#065F46', role: 'AI consulting' },
  { slug: 'hybrid-living', name: 'Hybrid Living', chip: '#0EA5E9', role: 'AI education' },
  { slug: 'nexus-labs', name: 'Nexus Labs', chip: '#DC2626', role: 'Media and creative' },
  { slug: 'terra-axis', name: 'Terra Axis', chip: '#991B1B', role: 'Property and smart buildings' },
  { slug: 'binary-loom', name: 'Binary Loom', chip: '#A3E635', role: 'Web and developer tools' },
  { slug: 'obsidian-arc', name: 'Obsidian Arc', chip: '#EF4444', role: 'Security' },
  { slug: 'kinetic-edge', name: 'Kinetic Edge', chip: '#16A34A', role: 'Sports performance' },
  { slug: 'quantum-ledger', name: 'Quantum Ledger', chip: '#8B5CF6', role: 'Financial intelligence' },
  { slug: 'juris-guard', name: 'Juris Guard', chip: '#C9A84C', role: 'AI governance' },
  { slug: 'signal-velocity', name: 'Signal Velocity', chip: '#F43F5E', role: 'Growth and paid media' },
];

/** A division site page, e.g. divisionUrl('zenflow', 'start.html'). Matches __SITE__'s divUrl. */
export function divisionUrl(slug: DivisionSlug, page = ''): string {
  return `${DIVISIONS_URL}/${slug}/${page.replace(/^\/+/, '')}`;
}

/** Slug for a publisher name, or null when the name is not one of the eleven. */
export function publisherSlug(publisher: string): DivisionSlug | null {
  return DIVISIONS.find((d) => d.name === publisher)?.slug ?? null;
}

/** Directory of all divisions on the divisions site. */
export const ALL_DIVISIONS_URL = `${DIVISIONS_URL}/#divisions`;
