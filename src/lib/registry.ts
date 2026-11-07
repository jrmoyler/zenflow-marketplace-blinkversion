import type {
  DataScope,
  FilterState,
  Product,
  ProductCategory,
  PricingModel,
  Publisher,
} from '../types/marketplace';

export const CATEGORIES: { id: ProductCategory; label: string; singular: string }[] = [
  { id: 'agents', label: 'Agents', singular: 'agent' },
  { id: 'workflows', label: 'Workflows', singular: 'workflow' },
  { id: 'automations', label: 'Automations', singular: 'automation' },
  { id: 'bots', label: 'Bots', singular: 'bot' },
];

export const PRICING_LABELS: Record<PricingModel, string> = {
  free: 'Free',
  monthly: 'Monthly',
  usage: 'Usage-based',
  'one-time': 'One-time',
};

/** Scopes that carry regulated or personal data. Touching them costs Aegis points. */
const SENSITIVE_SCOPES: DataScope[] = ['pii', 'health', 'payments'];

export const DEFAULT_FILTERS: FilterState = {
  query: '',
  categories: [],
  pricingModels: [],
  excludeScopes: [],
  publishers: [],
  minAegis: 0,
  sort: 'aegis',
};

export function registryId(p: Pick<Product, 'id' | 'category'>): string {
  const singular = CATEGORIES.find((c) => c.id === p.category)?.singular ?? p.category;
  return `zf/${singular}/${p.id}`;
}

export function formatPrice(p: Product['pricing']): string {
  switch (p.model) {
    case 'free':
      return 'Free';
    case 'monthly':
      return `$${p.amount}/mo`;
    case 'usage':
      return `$${p.amount} / 1k runs`;
    case 'one-time':
      return `$${p.amount} once`;
  }
}

export interface AegisLine {
  label: string;
  points: number;
  max: number;
}

/**
 * Aegis transparency score, 0–100. Every point comes from a fact the publisher
 * declared, so the buyer can audit the number line by line.
 */
export function aegisBreakdown(p: Product): AegisLine[] {
  const sensitive = p.scopes.filter((s) => SENSITIVE_SCOPES.includes(s)).length;
  return [
    { label: 'Decisions written to a readable audit log', points: p.aegis.auditLog ? 25 : 0, max: 25 },
    { label: 'Human approves irreversible actions', points: p.aegis.humanInLoop ? 20 : 0, max: 20 },
    { label: 'Prompts and logic inspectable', points: p.aegis.inspectable ? 15 : 0, max: 15 },
    { label: 'Refusals declared', points: Math.min(p.aegis.refusals.length, 3) * 5, max: 15 },
    { label: 'Escalation triggers declared', points: Math.min(p.aegis.escalations.length, 2) * 5, max: 10 },
    { label: 'Data footprint (fewer sensitive scopes)', points: Math.max(0, 15 - sensitive * 5), max: 15 },
  ];
}

export function aegisScore(p: Product): number {
  return aegisBreakdown(p).reduce((sum, line) => sum + line.points, 0);
}

function haystack(p: Product): string {
  return [p.title, p.summary, p.audience, p.publisher, p.deployedIn, ...p.capabilities, ...p.tags, ...p.integrations]
    .join(' ')
    .toLowerCase();
}

export function matchesQuery(p: Product, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const text = haystack(p);
  return terms.every((t) => text.includes(t));
}

/** Everything except the category facet; used so facet counts reflect other active filters. */
function passesNonCategory(p: Product, f: FilterState): boolean {
  if (!matchesQuery(p, f.query)) return false;
  if (f.pricingModels.length && !f.pricingModels.includes(p.pricing.model)) return false;
  if (f.excludeScopes.length && p.scopes.some((s) => f.excludeScopes.includes(s))) return false;
  if (f.publishers.length && !f.publishers.includes(p.publisher)) return false;
  if (aegisScore(p) < f.minAegis) return false;
  return true;
}

export function filterProducts(products: Product[], f: FilterState): Product[] {
  const result = products.filter(
    (p) => passesNonCategory(p, f) && (f.categories.length === 0 || f.categories.includes(p.category)),
  );
  return sortProducts(result, f.sort);
}

export function sortProducts(products: Product[], sort: FilterState['sort']): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'aegis':
      return copy.sort((a, b) => aegisScore(b) - aegisScore(a) || a.title.localeCompare(b.title));
    case 'updated':
      return copy.sort((a, b) => b.updated.localeCompare(a.updated));
    case 'price-asc':
      return copy.sort((a, b) => a.pricing.amount - b.pricing.amount);
    case 'price-desc':
      return copy.sort((a, b) => b.pricing.amount - a.pricing.amount);
    case 'name':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function categoryCounts(products: Product[], f: FilterState): Record<ProductCategory, number> {
  const counts = { agents: 0, workflows: 0, automations: 0, bots: 0 } as Record<ProductCategory, number>;
  for (const p of products) if (passesNonCategory(p, f)) counts[p.category] += 1;
  return counts;
}

export function isFiltered(f: FilterState): boolean {
  return (
    f.query.trim() !== '' ||
    f.categories.length > 0 ||
    f.pricingModels.length > 0 ||
    f.excludeScopes.length > 0 ||
    f.publishers.length > 0 ||
    f.minAegis > 0
  );
}

export function allPublishers(products: Product[]): Publisher[] {
  return [...new Set(products.map((p) => p.publisher))].sort();
}

export interface TaskMatch {
  product: Product;
  score: number;
  /** Terms from the brief that hit this listing — shown so the ranking is explainable. */
  matched: string[];
}

const STOPWORDS = new Set(
  'a an and the to of for in on with my our i we need want something that can from into is are be it this help me'.split(' '),
);

/**
 * Deterministic task finder: tokenizes a plain-language brief and ranks listings by
 * weighted term overlap. No model call — the UI says so.
 */
export function matchTask(products: Product[], brief: string, limit = 5): TaskMatch[] {
  const terms = [...new Set(brief.toLowerCase().match(/[a-z0-9]+/g) ?? [])].filter(
    (t) => t.length > 2 && !STOPWORDS.has(t),
  );
  if (terms.length === 0) return [];
  const matches: TaskMatch[] = [];
  for (const product of products) {
    const title = product.title.toLowerCase();
    const strong = [product.summary, ...product.capabilities, ...product.tags].join(' ').toLowerCase();
    const weak = haystack(product);
    let score = 0;
    const matched: string[] = [];
    for (const t of terms) {
      const stem = t.length > 4 ? t.replace(/(ing|ers|er|es|s|ed)$/, '') : t;
      if (title.includes(stem)) score += 4;
      else if (strong.includes(stem)) score += 2;
      else if (weak.includes(stem)) score += 1;
      else continue;
      matched.push(t);
    }
    if (score > 0) matches.push({ product, score, matched });
  }
  return matches
    .sort((a, b) => b.score - a.score || aegisScore(b.product) - aegisScore(a.product))
    .slice(0, limit);
}
