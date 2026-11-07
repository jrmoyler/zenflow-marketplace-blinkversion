import { describe, it, expect } from 'vitest';
import { openSource } from './openSource';
import snapshot from './openSource.snapshot.json';
import { CATEGORIES } from '../lib/registry';

/** OSI-approved SPDX ids actually used by the listings below. */
const OSI_LICENSES = ['MIT', 'Apache-2.0', 'AGPL-3.0', 'GPL-3.0', 'GPL-2.0', 'BSD-3-Clause', 'MPL-2.0', 'LGPL-3.0', 'ISC'];

const CHECKED_AT = '2026-11-07';
const PUSHED_CUTOFF = '2025-11-07';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BANNED = /\b(powerful|seamless(ly)?|next-gen|revolutionary|revolutioni[sz]e|supercharge|unlock|leverage|empower)\b/i;

interface SnapshotEntry {
  full_name: string;
  html_url: string;
  stargazers_count: number;
  license: string | null;
  pushed_at: string;
  archived: boolean;
}

const snap = snapshot as SnapshotEntry[];

describe('openSource listings', () => {
  it('has a reasonable number of listings', () => {
    expect(openSource.length).toBeGreaterThanOrEqual(32);
    expect(openSource.length).toBeLessThanOrEqual(44);
  });

  it('every category has at least 6 listings', () => {
    for (const c of CATEGORIES) {
      expect(openSource.filter((p) => p.category === c.id).length, c.id).toBeGreaterThanOrEqual(6);
    }
  });

  it('ids are unique and prefixed oss-', () => {
    const ids = openSource.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^oss-[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('repos are unique', () => {
    const repos = openSource.map((p) => p.openSource?.repo.toLowerCase());
    expect(new Set(repos).size).toBe(repos.length);
  });

  for (const p of openSource) {
    describe(p.id, () => {
      it('is an unassessed, free, open-source listing', () => {
        expect(p.source).toBe('open-source');
        expect(p.publisher).toBe('Open source');
        expect(p.aegis).toBeNull();
        expect(p.deployedIn).toBe('Not run by Collective AI');
        expect(p.pricing).toEqual({ model: 'free', amount: 0 });
        expect(p.directory).toBeUndefined();
      });

      it('carries verified GitHub facts', () => {
        const os = p.openSource;
        expect(os).toBeDefined();
        if (!os) return;
        expect(os.url).toBe(`https://github.com/${os.repo}`);
        expect(OSI_LICENSES).toContain(os.license);
        expect(os.stars).toBeGreaterThanOrEqual(500);
        if (p.category !== 'bots') expect(os.stars).toBeGreaterThanOrEqual(1000);
        expect(os.pushedAt).toMatch(ISO_DATE);
        expect(os.pushedAt >= PUSHED_CUTOFF).toBe(true);
        expect(os.checkedAt).toBe(CHECKED_AT);
        expect(os.language.length).toBeGreaterThan(0);
      });

      it('matches its snapshot entry', () => {
        const os = p.openSource!;
        const entry = snap.find((s) => s.full_name === os.repo);
        expect(entry, os.repo).toBeDefined();
        if (!entry) return;
        expect(entry.archived).toBe(false);
        expect(entry.html_url).toBe(os.url);
        expect(entry.stargazers_count).toBe(os.stars);
        expect(entry.license).toBe(os.license);
        expect(entry.pushed_at.slice(0, 10)).toBe(os.pushedAt);
      });

      it('has honest, complete copy', () => {
        expect(p.version).not.toBe('—');
        expect(p.version.length).toBeGreaterThan(0);
        expect(p.updated).toBe(p.openSource!.pushedAt);
        expect(p.changelog).toEqual([
          { version: p.version, date: p.openSource!.pushedAt, note: 'Latest push on GitHub as of 2026-11-07.' },
        ]);
        expect(p.capabilities.length).toBeGreaterThanOrEqual(2);
        expect(p.capabilities.length).toBeLessThanOrEqual(4);
        expect(p.tags.length).toBeLessThanOrEqual(6);
        for (const t of p.tags) expect(t).toBe(t.toLowerCase());
        for (const text of [p.title, p.summary, p.audience, ...p.capabilities]) {
          expect(text, text).not.toMatch(BANNED);
          expect(text, text).not.toMatch(/\d+(\.\d+)?\s?%/);
        }
      });
    });
  }
});
