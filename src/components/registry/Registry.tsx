import { useMemo, useState } from 'react';
import { ChevronDown, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import type { FilterState, Product, SortKey } from '@/types/marketplace';
import { CATEGORIES, DEFAULT_FILTERS, PRICING_LABELS, SOURCE_LABELS, filterProducts, isFiltered } from '@/lib/registry';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import Facets from './Facets';
import ListingCard from './ListingCard';
import ListingRow, { SCOPE_LABELS } from './ListingRow';

export type RegistryView = 'grid' | 'list';

/** localStorage key for the grid/list choice. A viewer preference, not a filter. */
export const VIEW_KEY = 'zf.view';

function readView(): RegistryView {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function writeView(v: RegistryView) {
  try {
    window.localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
}

export interface RegistryProps {
  products: Product[];
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  onOpenProduct: (p: Product) => void;
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'aegis', label: 'Aegis score' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'price-asc', label: 'Price low to high' },
  { value: 'price-desc', label: 'Price high to low' },
  { value: 'name', label: 'Name' },
];

interface ActiveFilter {
  key: string;
  label: string;
  remove: (f: FilterState) => FilterState;
}

/** Every active filter as a removable chip, in facet order. */
export function activeFilters(f: FilterState): ActiveFilter[] {
  const out: ActiveFilter[] = [];
  const q = f.query.trim();
  if (q) out.push({ key: 'query', label: `Search: "${q}"`, remove: (s) => ({ ...s, query: '' }) });
  for (const c of f.categories) {
    out.push({
      key: `cat:${c}`,
      label: CATEGORIES.find((x) => x.id === c)?.label ?? c,
      remove: (s) => ({ ...s, categories: s.categories.filter((x) => x !== c) }),
    });
  }
  for (const m of f.pricingModels) {
    out.push({
      key: `price:${m}`,
      label: PRICING_LABELS[m],
      remove: (s) => ({ ...s, pricingModels: s.pricingModels.filter((x) => x !== m) }),
    });
  }
  for (const sc of f.excludeScopes) {
    out.push({
      key: `scope:${sc}`,
      label: `No ${SCOPE_LABELS[sc]}`,
      remove: (s) => ({ ...s, excludeScopes: s.excludeScopes.filter((x) => x !== sc) }),
    });
  }
  for (const p of f.publishers) {
    out.push({
      key: `pub:${p}`,
      label: p,
      remove: (s) => ({ ...s, publishers: s.publishers.filter((x) => x !== p) }),
    });
  }
  for (const src of f.sources) {
    out.push({
      key: `src:${src}`,
      label: SOURCE_LABELS[src],
      remove: (s) => ({ ...s, sources: s.sources.filter((x) => x !== src) }),
    });
  }
  if (f.minAegis > 0) out.push({ key: 'aegis', label: `Aegis ${f.minAegis}+`, remove: (s) => ({ ...s, minAegis: 0 }) });
  return out;
}

function clearAll(f: FilterState): FilterState {
  return { ...DEFAULT_FILTERS, sort: f.sort };
}

const controlBase =
  'rounded-[4px] border border-zf-grid bg-zf-surface text-[13px] text-zf-text transition-colors duration-150 hover:bg-zf-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zf-blue';

export default function Registry({ products, filters, onFiltersChange, onOpenProduct }: RegistryProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setViewState] = useState<RegistryView>(readView);
  const setView = (v: RegistryView) => {
    setViewState(v);
    writeView(v);
  };
  const results = useMemo(() => filterProducts(products, filters), [products, filters]);
  const chips = activeFilters(filters);
  // The query is set from the nav search, so the mobile button counts facet filters only.
  const facetCount = chips.filter((c) => c.key !== 'query').length;

  /** In the empty state, the one chip whose removal brings back the most listings. */
  const mostRestrictive = useMemo(() => {
    if (results.length > 0 || chips.length === 0) return null;
    let best: { chip: ActiveFilter; count: number } | null = null;
    for (const chip of chips) {
      const count = filterProducts(products, chip.remove(filters)).length;
      if (!best || count > best.count) best = { chip, count };
    }
    return best && best.count > 0 ? best : null;
  }, [results.length, chips, products, filters]);

  return (
    <section
      id="registry"
      aria-labelledby="registry-heading"
      className="mx-auto w-full max-w-[1280px] scroll-mt-16 px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
    >
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto pb-6 pr-1">
            <Facets products={products} filters={filters} onFiltersChange={onFiltersChange} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <div>
              <h2 id="registry-heading" className="text-2xl font-medium tracking-tight text-zf-text">
                Registry
              </h2>
              <p className="mt-1 text-[13px] text-zf-muted" aria-live="polite" data-testid="result-count">
                <span className="font-mono tabular-nums text-zf-text">{results.length}</span> of{' '}
                <span className="font-mono tabular-nums">{products.length}</span>{' '}
                {products.length === 1 ? 'listing' : 'listings'}
              </p>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn(controlBase, 'inline-flex h-11 flex-1 items-center justify-center gap-2 px-3 sm:flex-none lg:hidden')}
              >
                <SlidersHorizontal className="h-4 w-4 text-zf-muted" aria-hidden="true" />
                Filters
                {facetCount > 0 && ' '}
                {facetCount > 0 && (
                  <span className="text-zf-muted">
                    (<span className="font-mono">{facetCount}</span> active)
                  </span>
                )}
              </button>

              <div className="flex flex-1 items-center gap-2 sm:flex-none">
                <label htmlFor="registry-sort" className="shrink-0 text-[13px] text-zf-muted">
                  Sort
                </label>
                <div className="relative w-full sm:w-auto">
                  <select
                    id="registry-sort"
                    value={filters.sort}
                    onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value as SortKey })}
                    className={cn(controlBase, 'h-11 w-full cursor-pointer appearance-none pl-3 pr-8 lg:h-9')}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zf-muted"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div role="group" aria-label="View" className="flex shrink-0 rounded-[4px] border border-zf-grid bg-zf-surface p-0.5">
                {(
                  [
                    { value: 'grid', label: 'Grid', Icon: LayoutGrid },
                    { value: 'list', label: 'List', Icon: List },
                  ] as const
                ).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={view === value}
                    onClick={() => setView(value)}
                    className={cn(
                      'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-[3px] px-2.5 text-[13px] transition-colors duration-150 lg:h-8',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zf-blue',
                      view === value ? 'bg-zf-raised text-zf-text' : 'text-zf-muted hover:text-zf-text',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {/* Icon-only below sm so the sort select keeps its width; the label stays the accessible name. */}
                    <span className="sr-only sm:not-sr-only">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => onFiltersChange(chip.remove(filters))}
                    aria-label={`Remove filter: ${chip.label}`}
                    className={cn(controlBase, 'inline-flex h-11 max-w-full items-center gap-1.5 pl-2.5 pr-2 lg:h-8')}
                  >
                    <span className="truncate">{chip.label}</span>
                    <X className="h-3.5 w-3.5 shrink-0 text-zf-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => onFiltersChange(clearAll(filters))}
                  className="h-11 rounded-[4px] px-2 text-[13px] text-zf-blue-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-zf-blue lg:h-8"
                >
                  Clear all
                </button>
              </li>
            </ul>
          )}

          {results.length > 0 && view === 'grid' ? (
            <ul aria-label="Listings" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <ListingCard key={p.id} product={p} onOpen={onOpenProduct} />
              ))}
            </ul>
          ) : results.length > 0 ? (
            <>
              <div
                aria-hidden="true"
                className="mt-6 hidden grid-cols-[minmax(0,1fr)_176px_104px_88px] gap-4 border-b border-zf-grid px-3 pb-2 text-xs text-zf-muted lg:grid"
              >
                <span>Listing</span>
                <span>Data scopes</span>
                <span className="text-right">Price</span>
                <span className="text-right">Aegis</span>
              </div>
              <ul
                aria-label="Listings"
                className="mt-4 flex flex-col gap-3 lg:mt-1 lg:gap-0 lg:divide-y lg:divide-zf-grid"
              >
                {results.map((p) => (
                  <ListingRow key={p.id} product={p} onOpen={onOpenProduct} />
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-zf-grid bg-zf-surface p-5 sm:p-6" role="status">
              {products.length === 0 ? (
                <>
                  <p className="text-[15px] font-medium text-zf-text">No listings published yet.</p>
                  <p className="mt-1 text-[13px] text-zf-muted">No division has published into the registry yet.</p>
                </>
              ) : (
                <>
                  <p className="text-[15px] font-medium text-zf-text">No listings match these filters.</p>
                  {isFiltered(filters) && (
                    <p className="mt-1 text-[13px] text-zf-muted">
                      Active: {chips.map((c) => c.label).join(', ')}.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {mostRestrictive && (
                      <button
                        type="button"
                        onClick={() => onFiltersChange(mostRestrictive.chip.remove(filters))}
                        className={cn(controlBase, 'inline-flex min-h-11 items-center px-3 text-left lg:min-h-9')}
                      >
                        Remove {mostRestrictive.chip.label}
                        <span className="ml-1 text-zf-muted">
                          (shows <span className="font-mono">{mostRestrictive.count}</span>)
                        </span>
                      </button>
                    )}
                    {isFiltered(filters) && (
                      <button
                        type="button"
                        onClick={() => onFiltersChange(clearAll(filters))}
                        className="min-h-11 rounded-[4px] px-2 text-[13px] text-zf-blue-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-zf-blue lg:min-h-9"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="flex max-h-[88vh] flex-col gap-0 rounded-t-[12px] border-zf-grid bg-zf-surface p-0 lg:hidden"
        >
          <SheetHeader className="border-b border-zf-grid px-4 py-4 text-left">
            <SheetTitle className="text-base font-medium text-zf-text">Filters</SheetTitle>
            <SheetDescription className="text-xs text-zf-muted">
              Counts update as you choose. Results update behind this panel.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <Facets products={products} filters={filters} onFiltersChange={onFiltersChange} />
          </div>
          <div className="flex items-center gap-2 border-t border-zf-grid px-4 py-3">
            {facetCount > 0 && (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...clearAll(filters), query: filters.query })}
                className="h-11 rounded-[4px] px-3 text-[13px] text-zf-blue-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-zf-blue"
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="h-11 flex-1 rounded-[4px] bg-zf-violet px-4 text-[13px] font-medium text-zf-text transition-colors duration-150 hover:bg-zf-violet/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zf-blue"
            >
              Show <span className="font-mono">{results.length}</span> {results.length === 1 ? 'listing' : 'listings'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
