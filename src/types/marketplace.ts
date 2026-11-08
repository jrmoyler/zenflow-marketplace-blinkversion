export type ProductCategory = 'agents' | 'workflows' | 'automations' | 'bots';

export type PricingModel = 'free' | 'monthly' | 'usage' | 'one-time' | 'quote';

/**
 * Where a listing comes from.
 * - collective: built by ZenFlow, run inside a Collective AI division.
 * - directory: a live offer on a division site (collective-ai-divisions).
 * - open-source: a public GitHub project, listed for reference. Collective AI
 *   does not run, vet or support it, and it carries no Aegis score.
 */
export type Source = 'collective' | 'directory' | 'open-source';

/**
 * The eleven active Collective AI divisions (charter order, source:
 * collective-ai-divisions + collectiveai DIVISIONS list). ZenFlow builds every
 * agent; the other ten are where each one was first deployed and who owns it.
 */
export type Publisher =
  | 'ZenFlow'
  | 'The Collective'
  | 'Hybrid Living'
  | 'Nexus Labs'
  | 'Terra Axis'
  | 'Binary Loom'
  | 'Obsidian Arc'
  | 'Kinetic Edge'
  | 'Quantum Ledger'
  | 'Juris Guard'
  | 'Signal Velocity';

/** Publisher shown for third-party GitHub projects. */
export type ListingPublisher = Publisher | 'Open source';

export interface OpenSourceInfo {
  /** owner/name */
  repo: string;
  url: string;
  /** SPDX id from the GitHub API, e.g. MIT, Apache-2.0, AGPL-3.0 */
  license: string;
  stars: number;
  language: string;
  /** ISO date of the last push, from the GitHub API */
  pushedAt: string;
  /** ISO date the facts above were read from the GitHub API */
  checkedAt: string;
}

export interface DirectoryInfo {
  /** Page on the division site where the offer is listed */
  url: string;
  status: 'available' | 'in-the-lab';
}

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
  source: Source;
  publisher: ListingPublisher;
  /** Where it already runs inside Collective AI, e.g. "Juris Guard intake desk". */
  deployedIn: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  integrations: string[];
  scopes: DataScope[];
  pricing: Pricing;
  /** null = not assessed (every open-source listing). Never invent declarations. */
  aegis: AegisDeclaration | null;
  openSource?: OpenSourceInfo;
  directory?: DirectoryInfo;
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
  publishers: ListingPublisher[];
  sources: Source[];
  minAegis: number;
  sort: SortKey;
}
