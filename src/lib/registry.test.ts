import { describe, it, expect } from 'vitest';
import {
  aegisBreakdown,
  aegisScore,
  allPublishers,
  categoryCounts,
  DEFAULT_FILTERS,
  filterProducts,
  formatPrice,
  isFiltered,
  matchTask,
  matchesQuery,
  registryId,
  sortProducts,
  sourceCounts,
} from './registry';
import type { FilterState, Product } from '../types/marketplace';
import { catalog } from '../data/catalog';

function make(overrides: Partial<Product> & Pick<Product, 'id'>): Product {
  return {
    title: overrides.id,
    summary: 'Does one job.',
    audience: 'Someone with that job.',
    category: 'agents',
    source: 'collective',
    publisher: 'ZenFlow',
    deployedIn: 'ZenFlow test bench',
    capabilities: ['First thing', 'Second thing'],
    inputs: ['Input'],
    outputs: ['Output'],
    integrations: ['Slack'],
    scopes: ['chat'],
    pricing: { model: 'free', amount: 0 },
    aegis: { refusals: ['Never does X'], escalations: [], auditLog: false, humanInLoop: false, inspectable: false },
    version: '1.0.0',
    updated: '2026-01-01',
    changelog: [{ version: '1.0.0', date: '2026-01-01', note: 'First.' }],
    tags: [],
    ...overrides,
  };
}

const filters = (f: Partial<FilterState> = {}): FilterState => ({ ...DEFAULT_FILTERS, ...f });

const reconciler = make({
  id: 'ledger-reconciler',
  title: 'Ledger Reconciler',
  summary: 'Matches bank feeds against open invoices.',
  category: 'agents',
  publisher: 'Quantum Ledger',
  integrations: ['Xero', 'Plaid'],
  scopes: ['payments', 'files'],
  pricing: { model: 'monthly', amount: 89 },
  aegis: {
    refusals: ['a', 'b', 'c', 'd'],
    escalations: ['x', 'y', 'z'],
    auditLog: true,
    humanInLoop: true,
    inspectable: true,
  },
  updated: '2026-10-28',
  tags: ['finance'],
});

const watcher = make({
  id: 'pricing-page-watcher',
  title: 'Pricing Page Watcher',
  summary: 'Posts competitor pricing page diffs to Slack.',
  category: 'bots',
  publisher: 'Signal Velocity',
  scopes: ['public-web', 'chat'],
  pricing: { model: 'free', amount: 0 },
  updated: '2026-05-08',
  tags: ['marketing'],
});

const intake = make({
  id: 'patient-intake',
  title: 'Patient Intake Routing',
  summary: 'Routes referrals to schedulers.',
  category: 'workflows',
  publisher: 'The Collective',
  scopes: ['health', 'pii', 'payments'],
  pricing: { model: 'usage', amount: 7.9 },
  aegis: { refusals: ['a'], escalations: ['x'], auditLog: true, humanInLoop: false, inspectable: false },
  updated: '2026-10-09',
  tags: ['health'],
});

const cleanup = make({
  id: 'cost-sweep',
  title: 'Cost Sweep',
  summary: 'Lists idle cloud resources.',
  category: 'automations',
  publisher: 'Binary Loom',
  scopes: ['files'],
  pricing: { model: 'one-time', amount: 199 },
  updated: '2026-07-15',
});

const products = [reconciler, watcher, intake, cleanup];

/** Open-source project: no Aegis declaration, so no score. */
const ossKit = make({
  id: 'ledger-kit',
  title: 'Ledger Kit',
  summary: 'Open-source scripts for bank reconciliation.',
  category: 'agents',
  source: 'open-source',
  publisher: 'Open source',
  aegis: null,
  openSource: {
    repo: 'acme/ledger-kit',
    url: 'https://github.com/acme/ledger-kit',
    license: 'MIT',
    stars: 12345,
    language: 'Python',
    pushedAt: '2026-10-30',
    checkedAt: '2026-11-07',
  },
});

/** Division service listed on a division site, sold by quote. */
const service = make({
  id: 'brand-audit',
  title: 'Brand Audit',
  category: 'workflows',
  source: 'directory',
  publisher: 'Nexus Labs',
  pricing: { model: 'quote', amount: 0 },
  directory: { url: 'https://example.com/nexus-labs/', status: 'available' },
});

const mixed = [...products, ossKit, service];

describe('registryId', () => {
  it('uses the singular category', () => {
    expect(registryId({ id: 'ledger-reconciler', category: 'agents' })).toBe('zf/agent/ledger-reconciler');
    expect(registryId({ id: 'x', category: 'workflows' })).toBe('zf/workflow/x');
    expect(registryId({ id: 'x', category: 'automations' })).toBe('zf/automation/x');
    expect(registryId({ id: 'x', category: 'bots' })).toBe('zf/bot/x');
  });
});

describe('formatPrice', () => {
  it('formats each pricing model', () => {
    expect(formatPrice({ model: 'free', amount: 0 })).toBe('Free');
    expect(formatPrice({ model: 'monthly', amount: 89 })).toBe('$89/mo');
    expect(formatPrice({ model: 'usage', amount: 2.4 })).toBe('$2.40 / 1k runs');
    expect(formatPrice({ model: 'one-time', amount: 149 })).toBe('$149 once');
    expect(formatPrice({ model: 'quote', amount: 0 })).toBe('Quoted');
  });
});

describe('aegisBreakdown / aegisScore', () => {
  it('gives 100 to a fully declared listing with no sensitive scopes', () => {
    const p = make({
      id: 'full',
      scopes: ['code'],
      aegis: { refusals: ['a', 'b', 'c'], escalations: ['x', 'y'], auditLog: true, humanInLoop: true, inspectable: true },
    });
    expect(aegisScore(p)).toBe(100);
    for (const line of aegisBreakdown(p)) expect(line.points).toBe(line.max);
  });

  it('caps refusals at 3 and escalations at 2', () => {
    const lines = aegisBreakdown(reconciler);
    expect(lines.find((l) => l.label.startsWith('Refusals'))?.points).toBe(15);
    expect(lines.find((l) => l.label.startsWith('Escalation'))?.points).toBe(10);
  });

  it('deducts 5 per sensitive scope and never goes below zero', () => {
    const footprint = (p: Product) => aegisBreakdown(p).find((l) => l.label.startsWith('Data footprint'))!.points;
    expect(footprint(watcher)).toBe(15);
    expect(footprint(reconciler)).toBe(10);
    expect(footprint(intake)).toBe(0);
  });

  it('scores a sparse declaration low', () => {
    // 1 refusal (5) + no sensitive scopes (15)
    expect(aegisScore(watcher)).toBe(20);
    // audit 25 + 1 refusal 5 + 1 escalation 5 + 3 sensitive (0)
    expect(aegisScore(intake)).toBe(35);
  });

  it('returns null and an empty breakdown for an unassessed listing', () => {
    expect(aegisScore(ossKit)).toBeNull();
    expect(aegisBreakdown(ossKit)).toEqual([]);
  });

  it('breakdown maxes sum to 100 and score equals the sum of points', () => {
    const lines = aegisBreakdown(reconciler);
    expect(lines.reduce((s, l) => s + l.max, 0)).toBe(100);
    expect(aegisScore(reconciler)).toBe(lines.reduce((s, l) => s + l.points, 0));
  });
});

describe('matchesQuery', () => {
  it('requires every term to appear (AND), case-insensitively', () => {
    expect(matchesQuery(reconciler, 'XERO invoices')).toBe(true);
    expect(matchesQuery(reconciler, 'xero slack')).toBe(false);
    expect(matchesQuery(reconciler, '   ')).toBe(true);
  });

  it('searches publisher and integrations', () => {
    expect(matchesQuery(reconciler, 'quantum')).toBe(true);
    expect(matchesQuery(reconciler, 'plaid')).toBe(true);
  });
});

describe('filterProducts', () => {
  it('returns everything with default filters, sorted by Aegis descending', () => {
    const result = filterProducts(products, filters());
    expect(result).toHaveLength(products.length);
    const scores = result.map((p) => aegisScore(p)!);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(result[0].id).toBe('ledger-reconciler');
  });

  it('filters by query', () => {
    expect(filterProducts(products, filters({ query: 'referrals' })).map((p) => p.id)).toEqual(['patient-intake']);
  });

  it('filters by category', () => {
    const ids = filterProducts(products, filters({ categories: ['bots', 'workflows'] })).map((p) => p.id);
    expect(ids.sort()).toEqual(['patient-intake', 'pricing-page-watcher']);
  });

  it('filters by pricing model', () => {
    expect(filterProducts(products, filters({ pricingModels: ['usage'] })).map((p) => p.id)).toEqual(['patient-intake']);
  });

  it('excludes listings touching any excluded scope', () => {
    const ids = filterProducts(products, filters({ excludeScopes: ['payments'] })).map((p) => p.id);
    expect(ids.sort()).toEqual(['cost-sweep', 'pricing-page-watcher']);
  });

  it('filters by publisher', () => {
    expect(filterProducts(products, filters({ publishers: ['Binary Loom'] })).map((p) => p.id)).toEqual(['cost-sweep']);
  });

  it('filters by minimum Aegis score', () => {
    const result = filterProducts(products, filters({ minAegis: 30 }));
    expect(result.every((p) => (aegisScore(p) ?? -1) >= 30)).toBe(true);
    expect(result.map((p) => p.id)).not.toContain('pricing-page-watcher');
  });

  it('sorts unassessed listings after every assessed one on aegis', () => {
    const ids = sortProducts(mixed, 'aegis').map((p) => p.id);
    expect(ids[ids.length - 1]).toBe('ledger-kit');
    // Even below a listing that scores 0-ish.
    const zero = make({
      id: 'zero',
      scopes: ['pii', 'health', 'payments'],
      aegis: { refusals: [], escalations: [], auditLog: false, humanInLoop: false, inspectable: false },
    });
    expect(aegisScore(zero)).toBe(0);
    expect(sortProducts([ossKit, zero], 'aegis').map((p) => p.id)).toEqual(['zero', 'ledger-kit']);
  });

  it('keeps unassessed listings with no minimum, hides them behind any minimum', () => {
    expect(filterProducts(mixed, filters()).map((p) => p.id)).toContain('ledger-kit');
    expect(filterProducts(mixed, filters({ minAegis: 1 })).map((p) => p.id)).not.toContain('ledger-kit');
  });

  it('filters by source', () => {
    expect(filterProducts(mixed, filters({ sources: ['open-source'] })).map((p) => p.id)).toEqual(['ledger-kit']);
    expect(filterProducts(mixed, filters({ sources: ['directory'] })).map((p) => p.id)).toEqual(['brand-audit']);
    const both = filterProducts(mixed, filters({ sources: ['collective', 'directory'] })).map((p) => p.id);
    expect(both).toHaveLength(products.length + 1);
    expect(both).not.toContain('ledger-kit');
  });

  it('filters by the Open source publisher and finds open-source repos by query', () => {
    expect(filterProducts(mixed, filters({ publishers: ['Open source'] })).map((p) => p.id)).toEqual(['ledger-kit']);
    expect(filterProducts(mixed, filters({ query: 'acme/ledger-kit' })).map((p) => p.id)).toEqual(['ledger-kit']);
  });

  it('combines facets with AND', () => {
    expect(filterProducts(products, filters({ categories: ['agents'], publishers: ['The Collective'] }))).toEqual([]);
  });

  it('sorts by recently updated', () => {
    const ids = filterProducts(products, filters({ sort: 'updated' })).map((p) => p.id);
    expect(ids).toEqual(['ledger-reconciler', 'patient-intake', 'cost-sweep', 'pricing-page-watcher']);
  });

  it('sorts by price ascending and descending', () => {
    expect(filterProducts(products, filters({ sort: 'price-asc' })).map((p) => p.pricing.amount)).toEqual([0, 7.9, 89, 199]);
    expect(filterProducts(products, filters({ sort: 'price-desc' })).map((p) => p.pricing.amount)).toEqual([199, 89, 7.9, 0]);
  });

  it('sorts by name', () => {
    const titles = filterProducts(products, filters({ sort: 'name' })).map((p) => p.title);
    expect(titles).toEqual(['Cost Sweep', 'Ledger Reconciler', 'Patient Intake Routing', 'Pricing Page Watcher']);
  });

  it('does not mutate the input array', () => {
    const before = products.map((p) => p.id);
    filterProducts(products, filters({ sort: 'name' }));
    expect(products.map((p) => p.id)).toEqual(before);
  });
});

describe('categoryCounts', () => {
  it('counts every category with no filters', () => {
    expect(categoryCounts(products, filters())).toEqual({ agents: 1, workflows: 1, automations: 1, bots: 1, databases: 0 });
  });

  it('ignores its own facet so other categories still show counts', () => {
    expect(categoryCounts(products, filters({ categories: ['agents'] }))).toEqual({
      agents: 1,
      workflows: 1,
      automations: 1,
      bots: 1,
      databases: 0,
    });
  });

  it('reflects the other active filters', () => {
    expect(categoryCounts(products, filters({ excludeScopes: ['payments'] }))).toEqual({
      agents: 0,
      workflows: 0,
      automations: 1,
      bots: 1,
      databases: 0,
    });
  });
});

describe('sourceCounts', () => {
  it('counts every source with no filters', () => {
    expect(sourceCounts(mixed, filters())).toEqual({ collective: 4, directory: 1, 'open-source': 1 });
  });

  it('ignores its own facet so other sources still show counts', () => {
    expect(sourceCounts(mixed, filters({ sources: ['open-source'] }))).toEqual({
      collective: 4,
      directory: 1,
      'open-source': 1,
    });
  });

  it('reflects the other active filters, including category and minimum Aegis', () => {
    expect(sourceCounts(mixed, filters({ categories: ['agents'] }))).toEqual({
      collective: 1,
      directory: 0,
      'open-source': 1,
    });
    expect(sourceCounts(mixed, filters({ minAegis: 1 }))['open-source']).toBe(0);
  });
});

describe('isFiltered', () => {
  it('is false for defaults and whitespace-only query', () => {
    expect(isFiltered(filters())).toBe(false);
    expect(isFiltered(filters({ query: '   ' }))).toBe(false);
  });

  it('ignores sort order', () => {
    expect(isFiltered(filters({ sort: 'name' }))).toBe(false);
  });

  it('is true when any facet is set', () => {
    expect(isFiltered(filters({ query: 'xero' }))).toBe(true);
    expect(isFiltered(filters({ categories: ['bots'] }))).toBe(true);
    expect(isFiltered(filters({ pricingModels: ['free'] }))).toBe(true);
    expect(isFiltered(filters({ excludeScopes: ['pii'] }))).toBe(true);
    expect(isFiltered(filters({ publishers: ['Obsidian Arc'] }))).toBe(true);
    expect(isFiltered(filters({ minAegis: 50 }))).toBe(true);
    expect(isFiltered(filters({ sources: ['open-source'] }))).toBe(true);
  });
});

describe('allPublishers', () => {
  it('returns unique publishers sorted', () => {
    expect(allPublishers([...products, reconciler])).toEqual([
      'Binary Loom',
      'Quantum Ledger',
      'Signal Velocity',
      'The Collective',
    ]);
  });
});

describe('registryId for open source', () => {
  it('uses the GitHub repo instead of a zf/ id', () => {
    expect(registryId({ id: 'oss-aider', category: 'agents', openSource: { repo: 'Aider-AI/aider' } })).toBe('github.com/Aider-AI/aider');
  });
});

describe('matchTask', () => {
  it('matches at word starts only and ignores filler words', () => {
    const base = catalogFixtureForWordTests();
    const r = matchTask(base, 'signing against');
    expect(r.map((m) => m.product.id)).toEqual(['signer']);
    expect(r[0].matched).toEqual(['signing']);
  });

  it('returns [] for an empty or stopword-only brief', () => {
    expect(matchTask(products, '')).toEqual([]);
    expect(matchTask(products, 'I need something that can help me with my')).toEqual([]);
  });

  it('ranks a title hit above a weak (haystack-only) hit', () => {
    const titleHit = make({ id: 'title-hit', title: 'Invoice Chaser', summary: 'Sends reminders.' });
    const weakHit = make({ id: 'weak-hit', title: 'Other Tool', summary: 'Sends reminders.', deployedIn: 'Invoice desk' });
    const [first, second] = matchTask([weakHit, titleHit], 'invoice');
    expect(first.product.id).toBe('title-hit');
    expect(first.score).toBe(4);
    expect(second.product.id).toBe('weak-hit');
    expect(second.score).toBe(1);
  });

  it('ranks a strong (summary) hit between title and weak hits', () => {
    const strong = make({ id: 'strong', title: 'Other', summary: 'Chases every invoice.' });
    const weak = make({ id: 'weak', title: 'Another', deployedIn: 'Invoice desk' });
    const result = matchTask([weak, strong], 'invoice');
    expect(result.map((m) => [m.product.id, m.score])).toEqual([
      ['strong', 2],
      ['weak', 1],
    ]);
  });

  it('reports which brief terms matched and skips listings with none', () => {
    const result = matchTask(products, 'reconcile bank feeds in xero');
    expect(result[0].product.id).toBe('ledger-reconciler');
    expect(result[0].matched).toEqual(expect.arrayContaining(['bank', 'feeds', 'xero']));
    expect(result.map((m) => m.product.id)).not.toContain('cost-sweep');
  });

  it('stems plural and -ing forms', () => {
    const result = matchTask(products, 'routing referrals');
    expect(result[0].product.id).toBe('patient-intake');
  });

  it('breaks score ties by Aegis score and respects the limit', () => {
    const low = make({ id: 'low', title: 'Digest A' });
    const high = make({
      id: 'high',
      title: 'Digest B',
      aegis: { refusals: ['a'], escalations: [], auditLog: true, humanInLoop: false, inspectable: false },
    });
    expect(matchTask([low, high], 'digest').map((m) => m.product.id)).toEqual(['high', 'low']);
    expect(matchTask([low, high], 'digest', 1)).toHaveLength(1);
  });
});

function catalogFixtureForWordTests() {
  const mk = (id: string, title: string) =>
    ({ ...catalog[0], id, title, summary: title, capabilities: [title], tags: [], integrations: [], audience: '', deployedIn: '', publisher: 'ZenFlow' }) as typeof catalog[0];
  return [mk('designer', 'Design review'), mk('signer', 'Signing desk')];
}
