import { describe, it, expect } from 'vitest';
import { catalog } from './catalog';
import { aegisScore, CATEGORIES } from '../lib/registry';
import type { Publisher } from '../types/marketplace';

const PUBLISHERS: Publisher[] = [
  'ZenFlow',
  'The Collective',
  'Hybrid Living',
  'Nexus Labs',
  'Binary Loom',
  'Obsidian Arc',
  'Quantum Ledger',
  'Juris Guard',
  'Signal Velocity',
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

function isValidIsoDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Words the voice standard bans from listing copy. */
const BANNED = /\b(powerful|seamless(ly)?|cutting-edge|next-gen|robust|revolutionary|revolutioni[sz]e|supercharge|unlock|streamline|leverage|empower)\b/i;

describe('catalog', () => {
  it('has 32–40 listings', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(32);
    expect(catalog.length).toBeLessThanOrEqual(40);
  });

  it('has unique kebab-case ids', () => {
    const ids = catalog.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('keeps the ledger-reconciler listing', () => {
    expect(catalog.find((p) => p.id === 'ledger-reconciler')).toBeDefined();
  });

  it('has at least 7 listings in every category', () => {
    for (const c of CATEGORIES) {
      expect(catalog.filter((p) => p.category === c.id).length, c.id).toBeGreaterThanOrEqual(7);
    }
  });

  it('uses every publisher', () => {
    for (const pub of PUBLISHERS) {
      expect(catalog.some((p) => p.publisher === pub), pub).toBe(true);
    }
  });

  it.each(catalog.map((p) => [p.id, p] as const))('%s is complete and consistent', (_id, p) => {
    expect(p.title.trim()).not.toBe('');
    expect(p.summary.trim()).not.toBe('');
    expect(p.audience.trim()).not.toBe('');
    expect(p.deployedIn.trim()).not.toBe('');
    expect(p.capabilities.length).toBeGreaterThanOrEqual(2);
    expect(p.inputs.length).toBeGreaterThanOrEqual(1);
    expect(p.outputs.length).toBeGreaterThanOrEqual(1);
    expect(p.integrations.length).toBeGreaterThanOrEqual(1);
    expect(p.scopes.length).toBeGreaterThanOrEqual(1);
    expect(new Set(p.scopes).size).toBe(p.scopes.length);
    expect(p.aegis.refusals.length).toBeGreaterThanOrEqual(1);

    // Pricing: amount is 0 if and only if free.
    if (p.pricing.model === 'free') expect(p.pricing.amount).toBe(0);
    else expect(p.pricing.amount).toBeGreaterThan(0);

    // Versions and dates.
    expect(p.version).toMatch(SEMVER);
    expect(isValidIsoDate(p.updated)).toBe(true);
    expect(p.changelog.length).toBeGreaterThanOrEqual(1);
    expect(p.changelog.length).toBeLessThanOrEqual(4);
    expect(p.changelog[0].version).toBe(p.version);
    expect(p.updated).toBe(p.changelog[0].date);
    for (const entry of p.changelog) {
      expect(entry.version).toMatch(SEMVER);
      expect(isValidIsoDate(entry.date), entry.date).toBe(true);
      expect(entry.note.trim()).not.toBe('');
    }
    // Newest first.
    for (let i = 1; i < p.changelog.length; i++) {
      expect(p.changelog[i - 1].date >= p.changelog[i].date).toBe(true);
    }

    // Tags are lowercase.
    for (const t of p.tags) expect(t).toBe(t.toLowerCase());

    // Voice standard.
    for (const text of [p.title, p.summary, p.audience, ...p.capabilities]) {
      expect(text, text).not.toMatch(BANNED);
    }
    expect(p.summary).not.toMatch(/\d+%/);
  });

  it('ZenFlow publishes the most listings', () => {
    const counts = new Map<Publisher, number>();
    for (const p of catalog) counts.set(p.publisher, (counts.get(p.publisher) ?? 0) + 1);
    const zf = counts.get('ZenFlow') ?? 0;
    for (const [pub, n] of counts) if (pub !== 'ZenFlow') expect(zf, pub).toBeGreaterThan(n);
  });

  it('declares no clinical or health-data listings (out of scope for the divisions)', () => {
    expect(catalog.filter((p) => p.scopes.includes('health')).map((p) => p.id)).toEqual([]);
  });

  it('marks 5–7 listings as featured', () => {
    const n = catalog.filter((p) => p.featured).length;
    expect(n).toBeGreaterThanOrEqual(5);
    expect(n).toBeLessThanOrEqual(7);
  });

  it('has a real spread of Aegis scores', () => {
    const scores = catalog.map(aegisScore);
    expect(Math.min(...scores)).toBeLessThanOrEqual(45);
    expect(Math.max(...scores)).toBeGreaterThanOrEqual(90);
    expect(scores.filter((s) => s >= 90).length).toBeLessThan(catalog.length / 2);
    expect(scores.every((s) => s >= 0 && s <= 100)).toBe(true);
  });

  it('uses every pricing model', () => {
    const models = new Set(catalog.map((p) => p.pricing.model));
    expect([...models].sort()).toEqual(['free', 'monthly', 'one-time', 'usage']);
  });
});
