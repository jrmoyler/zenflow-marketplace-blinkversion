import { useMemo, type FormEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { Product, ProductCategory } from '../../types/marketplace';
import { CATEGORIES, aegisScore, matchesQuery } from '../../lib/registry';
import { cn } from '../../lib/utils';
import Lattice, { CATEGORY_FILL } from './Lattice';
import { ZfButton } from '../brand/Button';

export interface HeroStats {
  listings: number;
  departments: number;
  /** Median Aegis score, rounded; null when the catalog is empty. */
  medianAegis: number | null;
  humanInLoop: number;
}

export function heroStats(products: Product[]): HeroStats {
  const scores = products.map(aegisScore).sort((a, b) => a - b);
  let medianAegis: number | null = null;
  if (scores.length) {
    const mid = Math.floor(scores.length / 2);
    medianAegis = Math.round(scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2);
  }
  return {
    listings: products.length,
    departments: new Set(products.map((p) => p.publisher)).size,
    medianAegis,
    humanInLoop: products.filter((p) => p.aegis.humanInLoop).length,
  };
}

export interface HeroProps {
  products: Product[];
  query: string;
  onQueryChange: (q: string) => void;
  activeCategories: ProductCategory[];
  onToggleCategory: (c: ProductCategory) => void;
  onOpenProduct: (p: Product) => void;
  onOpenTaskFinder: () => void;
}

export default function Hero({
  products,
  query,
  onQueryChange,
  activeCategories,
  onToggleCategory,
  onOpenProduct,
  onOpenTaskFinder,
}: HeroProps) {
  const reduceMotion = useReducedMotion();
  const stats = useMemo(() => heroStats(products), [products]);

  const counts = useMemo(() => {
    const c = { agents: 0, workflows: 0, automations: 0, bots: 0 } as Record<ProductCategory, number>;
    for (const p of products) c[p.category] += 1;
    return c;
  }, [products]);

  const highlightIds = useMemo(() => {
    if (!query.trim() && activeCategories.length === 0) return undefined;
    return new Set(
      products
        .filter(
          (p) =>
            matchesQuery(p, query) && (activeCategories.length === 0 || activeCategories.includes(p.category)),
        )
        .map((p) => p.id),
    );
  }, [products, query, activeCategories]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    document.getElementById('registry')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const statItems: { label: string; value: string; aegis?: boolean }[] = [
    { label: 'Listings', value: String(stats.listings) },
    { label: 'Departments', value: String(stats.departments) },
    { label: 'Median Aegis', value: stats.medianAegis === null ? '–' : String(stats.medianAegis), aegis: true },
    { label: 'Human-in-loop', value: String(stats.humanInLoop) },
  ];

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-zf-grid">
      <div aria-hidden="true" className="zf-grid-bg absolute inset-0 opacity-40" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="min-w-0 lg:col-span-5">
          {/* The one entrance on the page: CSS, so the copy is never left hidden if JS animation stalls. */}
          <div className="motion-safe:animate-slide-up">
            <h1
              id="hero-title"
              className="text-[2.125rem] font-bold leading-[1.08] tracking-[-0.02em] text-zf-text sm:text-5xl lg:text-[3.25rem]"
            >
              Agents built to be trusted, published by the teams that run them.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zf-muted sm:text-lg">
              Every listing in this registry already runs inside a Collective AI department, and declares what data it
              touches, what it refuses to do, and when it hands control to a person.
            </p>
          </div>

          <form role="search" onSubmit={submit} className="mt-8">
            <label htmlFor="hero-search" className="sr-only">
              Search the registry
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zf-muted"
                />
                <input
                  id="hero-search"
                  type="search"
                  aria-label="Search the registry"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Reconcile invoices, triage tickets"
                  autoComplete="off"
                  className="h-14 w-full rounded-[4px] border border-zf-grid bg-zf-surface pl-12 pr-4 text-base text-zf-text placeholder:text-zf-muted/70 transition-colors duration-150 hover:border-zf-muted/40 focus:border-zf-blue focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zf-blue"
                />
              </div>
              <ZfButton type="submit" className="sm:min-h-14">
                Search
              </ZfButton>
            </div>
          </form>
          <button
            type="button"
            onClick={onOpenTaskFinder}
            className="mt-3 rounded-[4px] text-sm font-medium text-zf-blue-text underline-offset-4 hover:underline"
          >
            Describe a task instead
          </button>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-zf-grid pt-6 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {statItems.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="whitespace-nowrap text-xs text-zf-muted">{s.label}</dt>
                <dd
                  className={cn(
                    'mt-1 font-mono text-2xl font-medium tabular-nums',
                    s.aegis ? 'text-zf-aegis' : 'text-zf-text',
                  )}
                  data-stat={s.label}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <div role="group" aria-label="Filter by category" className="mt-8 flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const pressed = activeCategories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => onToggleCategory(c.id)}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 rounded-[4px] border px-2.5 text-sm transition-colors duration-150',
                    pressed
                      ? 'border-zf-violet-text/60 bg-zf-violet/20 text-zf-text'
                      : 'border-zf-grid bg-zf-surface text-zf-muted hover:border-zf-muted/40 hover:text-zf-text',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_FILL[c.id] }}
                  />
                  {c.label}
                  <span className="font-mono text-xs text-zf-muted">{counts[c.id]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative min-w-0 lg:col-span-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(124,58,237,0.20),transparent)]"
          />
          <Lattice
            products={products}
            highlightIds={highlightIds}
            activeCategories={activeCategories}
            onSelectCategory={onToggleCategory}
            onSelectProduct={onOpenProduct}
            className="relative h-[260px] sm:h-[340px] lg:h-[460px]"
          />
        </div>
      </div>
    </section>
  );
}
