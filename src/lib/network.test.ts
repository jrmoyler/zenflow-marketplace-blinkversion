import {
  ALL_DIVISIONS_URL,
  ASSESSMENT_URL,
  DIVISIONS,
  DIVISIONS_URL,
  HUB_URL,
  LEAD_ENDPOINT,
  MAIN_URL,
  divisionUrl,
  pick,
  publisherSlug,
} from './network';
import { MARKS } from '@/brand/marks.js';

const DIVISION_NAMES = [
  'ZenFlow',
  'The Collective',
  'Hybrid Living',
  'Nexus Labs',
  'Terra Axis',
  'Binary Loom',
  'Obsidian Arc',
  'Kinetic Edge',
  'Quantum Ledger',
  'Juris Guard',
  'Signal Velocity',
];

describe('network config', () => {
  it('defaults to the production network URLs', () => {
    expect(MAIN_URL).toBe('https://collectiveai-roan.vercel.app/');
    expect(HUB_URL).toBe('https://collective-ai-start.vercel.app/');
    expect(ASSESSMENT_URL).toBe('https://the-collective-ai-assessment-platfo.vercel.app/');
    expect(DIVISIONS_URL).toBe('https://collective-ai-divisions-brown.vercel.app');
    expect(LEAD_ENDPOINT).toBe('https://collective-ai-divisions-brown.vercel.app/api/lead');
    expect(ALL_DIVISIONS_URL).toBe('https://collective-ai-divisions-brown.vercel.app/#divisions');
  });

  it('pick() uses non-empty overrides only', () => {
    expect(pick('https://x.test/', 'd')).toBe('https://x.test/');
    expect(pick('  ', 'd')).toBe('d');
    expect(pick(undefined, 'd')).toBe('d');
    expect(pick(true, 'd')).toBe('d');
  });

  it('lists the eleven divisions in charter order, each with an official mark', () => {
    expect(DIVISIONS.map((d) => d.name)).toEqual(DIVISION_NAMES);
    expect(new Set(DIVISIONS.map((d) => d.slug)).size).toBe(11);
    for (const d of DIVISIONS) {
      expect(d.chip).toMatch(/^#[0-9A-F]{6}$/i);
      expect(d.role.length).toBeGreaterThan(0);
      expect(MARKS[d.slug]?.svg).toMatch(/^<svg /);
    }
  });

  it('builds division URLs like the divisions site does', () => {
    expect(divisionUrl('zenflow')).toBe('https://collective-ai-divisions-brown.vercel.app/zenflow/');
    expect(divisionUrl('zenflow', 'start.html')).toBe('https://collective-ai-divisions-brown.vercel.app/zenflow/start.html');
    expect(divisionUrl('juris-guard', '/services.html')).toBe(
      'https://collective-ai-divisions-brown.vercel.app/juris-guard/services.html',
    );
  });

  it('maps publisher names to slugs', () => {
    expect(publisherSlug('ZenFlow')).toBe('zenflow');
    expect(publisherSlug('The Collective')).toBe('the-collective');
    expect(publisherSlug('Signal Velocity')).toBe('signal-velocity');
    expect(publisherSlug('ZenFlow Labs')).toBeNull();
    expect(publisherSlug('')).toBeNull();
  });
});
