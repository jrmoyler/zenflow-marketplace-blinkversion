export type ProductCategory = 'agents' | 'workflows' | 'automations' | 'bots';

export type PricingModel = 'free' | 'monthly' | 'usage' | 'one-time';

/** Collective AI departments that publish into the registry. */
export type Publisher =
  | 'ZenFlow Labs'
  | 'Binary Loom'
  | 'Juris Guard'
  | 'Quantum Ledger'
  | 'Kinetic Edge'
  | 'Vital Helix'
  | 'Signal Velocity'
  | 'Civic Core'
  | 'The Collective';

/** What a listing is allowed to read or write. Drives the Aegis score and a facet. */
export type DataScope =
  | 'email'
  | 'calendar'
  | 'crm'
  | 'files'
  | 'payments'
  | 'pii'
  | 'health'
  | 'code'
  | 'public-web'
  | 'chat';

export interface Pricing {
  model: PricingModel;
  /** USD. 0 for free. Monthly → per month, usage → per 1k runs, one-time → once. */
  amount: number;
}

export interface AegisDeclaration {
  /** Things the listing will not do, stated plainly. At least one. */
  refusals: string[];
  /** Conditions that hand control to a human. */
  escalations: string[];
  /** Every decision written to an audit log the buyer can read. */
  auditLog: boolean;
  /** A human approves before any irreversible action. */
  humanInLoop: boolean;
  /** Source of model prompts / logic is inspectable by the buyer. */
  inspectable: boolean;
}

export interface ChangelogEntry {
  version: string;
  /** ISO date, e.g. 2026-09-14 */
  date: string;
  note: string;
}

export interface Product {
  /** Stable slug id, e.g. "ledger-reconciler". Full registry id is `zf/<category-singular>/<id>`. */
  id: string;
  title: string;
  /** One sentence: what it does. */
  summary: string;
  /** Who it's for, one sentence. */
  audience: string;
  category: ProductCategory;
  publisher: Publisher;
  /** Where it already runs inside Collective AI, e.g. "Juris Guard intake desk". */
  deployedIn: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  integrations: string[];
  scopes: DataScope[];
  pricing: Pricing;
  aegis: AegisDeclaration;
  version: string;
  /** ISO date of last update. */
  updated: string;
  changelog: ChangelogEntry[];
  tags: string[];
  featured?: boolean;
}

export type SortKey = 'aegis' | 'updated' | 'price-asc' | 'price-desc' | 'name';

export interface FilterState {
  query: string;
  categories: ProductCategory[];
  pricingModels: PricingModel[];
  /** Exclude listings touching any of these scopes. */
  excludeScopes: DataScope[];
  publishers: Publisher[];
  minAegis: number;
  sort: SortKey;
}
