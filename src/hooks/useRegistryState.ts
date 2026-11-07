import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  DataScope,
  FilterState,
  PricingModel,
  ProductCategory,
  Publisher,
  SortKey,
} from '../types/marketplace';
import { CATEGORIES, DEFAULT_FILTERS, PRICING_LABELS } from '../lib/registry';
import { DIVISIONS } from '../lib/network';

/**
 * Registry view state (filters + open listing) mirrored to the query string, so
 * every view is linkable and the browser Back button closes an open listing.
 *
 *   ?q=…&cat=agents,bots&price=free,monthly&noscope=pii,health
 *    &pub=Juris%20Guard&aegis=70&sort=updated&listing=ledger-reconciler
 *
 * Default values are omitted. Unknown values are dropped on parse.
 */

const VALID_CATEGORIES: readonly ProductCategory[] = CATEGORIES.map((c) => c.id);
const VALID_PRICING = Object.keys(PRICING_LABELS) as PricingModel[];
const VALID_SCOPES: readonly DataScope[] = [
  'email',
  'calendar',
  'crm',
  'files',
  'payments',
  'pii',
  'health',
  'code',
  'public-web',
  'chat',
];
/** The nine division names, from the network config. */
const VALID_PUBLISHERS: readonly Publisher[] = DIVISIONS.map((d) => d.name);
const VALID_SORTS: readonly SortKey[] = ['aegis', 'updated', 'price-asc', 'price-desc', 'name'];

const MAX_QUERY_LENGTH = 200;
const LISTING_ID = /^[a-z0-9][a-z0-9-]{0,99}$/;

export interface RegistryUrlState {
  filters: FilterState;
  listingId: string | null;
}

function parseList<T extends string>(raw: string | null, valid: readonly T[]): T[] {
  if (!raw) return [];
  const out: T[] = [];
  for (const part of raw.split(',')) {
    const value = part.trim() as T;
    if (valid.includes(value) && !out.includes(value)) out.push(value);
  }
  return out;
}

function parseAegis(raw: string | null): number {
  if (raw === null || raw.trim() === '') return DEFAULT_FILTERS.minAegis;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_FILTERS.minAegis;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Parse a `location.search` string. Never throws; falls back to defaults. */
export function parseQuery(search: string): RegistryUrlState {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = new URLSearchParams();
  }

  const sort = params.get('sort') as SortKey | null;
  const listing = params.get('listing')?.trim().toLowerCase() ?? '';

  return {
    filters: {
      query: (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH),
      categories: parseList(params.get('cat'), VALID_CATEGORIES),
      pricingModels: parseList(params.get('price'), VALID_PRICING),
      excludeScopes: parseList(params.get('noscope'), VALID_SCOPES),
      publishers: parseList(params.get('pub'), VALID_PUBLISHERS),
      minAegis: parseAegis(params.get('aegis')),
      sort: sort && VALID_SORTS.includes(sort) ? sort : DEFAULT_FILTERS.sort,
    },
    listingId: LISTING_ID.test(listing) ? listing : null,
  };
}

/** Commas are list separators, so they stay literal; everything else is percent-encoded. */
function encodeList(values: readonly string[]): string {
  return values.map((v) => encodeURIComponent(v)).join(',');
}

/** Build a query string (with leading `?`, or `''` when everything is default). */
export function serializeQuery(filters: FilterState, listingId: string | null): string {
  const parts: string[] = [];
  const query = filters.query.trim();
  if (query) parts.push(`q=${encodeURIComponent(filters.query)}`);
  if (filters.categories.length) parts.push(`cat=${encodeList(filters.categories)}`);
  if (filters.pricingModels.length) parts.push(`price=${encodeList(filters.pricingModels)}`);
  if (filters.excludeScopes.length) parts.push(`noscope=${encodeList(filters.excludeScopes)}`);
  if (filters.publishers.length) parts.push(`pub=${encodeList(filters.publishers)}`);
  const aegis = Math.max(0, Math.min(100, Math.round(filters.minAegis || 0)));
  if (aegis !== DEFAULT_FILTERS.minAegis) parts.push(`aegis=${aegis}`);
  if (filters.sort !== DEFAULT_FILTERS.sort) parts.push(`sort=${encodeURIComponent(filters.sort)}`);
  if (listingId) parts.push(`listing=${encodeURIComponent(listingId)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function readLocation(): RegistryUrlState {
  if (typeof window === 'undefined') return { filters: DEFAULT_FILTERS, listingId: null };
  return parseQuery(window.location.search);
}

function writeLocation(state: RegistryUrlState, mode: 'push' | 'replace') {
  if (typeof window === 'undefined') return;
  const { pathname, hash, search } = window.location;
  const nextSearch = serializeQuery(state.filters, state.listingId);
  if (nextSearch === search || (nextSearch === '' && search === '?')) return;
  const url = `${pathname}${nextSearch}${hash}`;
  try {
    if (mode === 'push') window.history.pushState(null, '', url);
    else window.history.replaceState(window.history.state, '', url);
  } catch {
    // History can be unavailable (sandboxed iframes); state still works in memory.
  }
}

export type FiltersUpdate = FilterState | ((prev: FilterState) => FilterState);

export function useRegistryState() {
  const [state, setState] = useState<RegistryUrlState>(readLocation);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const onPop = () => setState(readLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** Filter edits (typing, facet toggles) replace the current entry — no history spam. */
  const setFilters = useCallback((update: FiltersUpdate) => {
    const prev = stateRef.current;
    const filters = typeof update === 'function' ? update(prev.filters) : update;
    const next = { ...prev, filters };
    stateRef.current = next;
    writeLocation(next, 'replace');
    setState(next);
  }, []);

  /** Opening and closing a listing push entries so Back closes the sheet. */
  const openListing = useCallback((id: string) => {
    const prev = stateRef.current;
    if (prev.listingId === id) return;
    const next = { ...prev, listingId: id };
    stateRef.current = next;
    writeLocation(next, 'push');
    setState(next);
  }, []);

  const closeListing = useCallback(() => {
    const prev = stateRef.current;
    if (prev.listingId === null) return;
    const next = { ...prev, listingId: null };
    stateRef.current = next;
    writeLocation(next, 'push');
    setState(next);
  }, []);

  return {
    filters: state.filters,
    setFilters,
    openListingId: state.listingId,
    openListing,
    closeListing,
  };
}

export default useRegistryState;
