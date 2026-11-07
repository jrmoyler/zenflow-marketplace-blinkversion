import { describe, it, expect } from 'vitest';
import { directory, DIVISIONS_BASE, DIVISION_SLUGS } from './directory';
import { catalog } from './catalog';
import { CATEGORIES } from '../lib/registry';

/** Generated pages per division (collective-ai-divisions build/divisions/<slug>.js `pages`). */
const PAGES: Record<string, string[]> = {
  zenflow: ['index.html', 'services.html', 'decision-log.html', 'start.html'],
  'the-collective': ['index.html', 'services.html', 'approach.html', 'start.html'],
  'hybrid-living': ['index.html', 'tracks.html', 'teams.html', 'start.html'],
  'nexus-labs': ['index.html', 'studio.html', 'originals.html', 'start.html'],
  'binary-loom': ['index.html', 'build.html', 'start.html'],
  'obsidian-arc': ['index.html', 'coverage.html', 'rules.html', 'start.html'],
  'quantum-ledger': ['index.html', 'products.html', 'principles.html', 'start.html'],
  'juris-guard': ['index.html', 'platform.html', 'scope.html', 'start.html'],
  'signal-velocity': ['index.html', 'services.html', 'sprint.html', 'start.html'],
};

const BANNED = /\b(powerful|seamless(ly)?|cutting-edge|next-gen|robust|revolutionary|revolutioni[sz]e|supercharge|unlock|streamline|leverage|empower|scroll-stopping)\b/i;

describe('directory', () => {
  it('has between 8 and 20 listings', () => {
    expect(directory.length).toBeGreaterThanOrEqual(8);
    expect(directory.length).toBeLessThanOrEqual(20);
  });

  it('every listing is a directory listing with deployedIn naming its division site', () => {
    for (const p of directory) {
      expect(p.source).toBe('directory');
      expect(p.deployedIn).toBe(`Offered on the ${p.publisher} site`);
      expect(p.directory).toBeDefined();
      expect(['available', 'in-the-lab']).toContain(p.directory!.status);
    }
  });

  it('points each listing at a generated page on its own division site', () => {
    for (const p of directory) {
      const url = p.directory!.url;
      expect(url.startsWith(`${DIVISIONS_BASE}/`)).toBe(true);
      expect(url).toMatch(/\/[a-z-]+\/[a-z-]+\.html$/);
      const [slug, file] = url.slice(DIVISIONS_BASE.length + 1).split('/');
      expect(Object.keys(PAGES)).toContain(slug);
      expect(slug).toBe(DIVISION_SLUGS[p.publisher as keyof typeof DIVISION_SLUGS]);
      expect(PAGES[slug]).toContain(file);
    }
  });

  it('has kebab-case ids unique across the directory and the catalog', () => {
    const ids = [...catalog, ...directory].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of directory) expect(p.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('uses valid categories and lowercase tags', () => {
    const valid = CATEGORIES.map((c) => c.id);
    for (const p of directory) {
      expect(valid).toContain(p.category);
      expect(p.tags.length).toBeGreaterThan(0);
      for (const t of p.tags) expect(t).toBe(t.toLowerCase());
    }
  });

  it('prices quoted offers at 0 and free offers at 0', () => {
    for (const p of directory) {
      if (p.pricing.model === 'quote' || p.pricing.model === 'free') expect(p.pricing.amount).toBe(0);
      else expect(p.pricing.amount).toBeGreaterThan(0);
    }
  });

  it('declares aegis only with at least one refusal, otherwise null', () => {
    for (const p of directory) {
      if (p.aegis !== null) expect(p.aegis.refusals.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('carries one changelog entry matching version and updated date', () => {
    for (const p of directory) {
      expect(p.version).toBe('1.0.0');
      expect(p.changelog).toHaveLength(1);
      expect(p.changelog[0]).toEqual({ version: '1.0.0', date: p.updated, note: `Listed from the ${p.publisher} site.` });
    }
  });

  it('keeps copy free of hype words', () => {
    for (const p of directory) expect(`${p.title} ${p.summary} ${p.audience}`).not.toMatch(BANNED);
  });
});
