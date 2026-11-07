import { useCallback, useMemo, useState } from 'react';
import Navbar from './components/layout/Navbar';
import ParentStrip from './components/layout/ParentStrip';
import Footer from './components/layout/Footer';
import Hero from './components/home/Hero';
import Registry from './components/registry/Registry';
import ListingSheet from './components/registry/ListingSheet';
import TaskFinder from './components/registry/TaskFinder';
import { catalog } from './data';
import { aegisBreakdown } from './lib/registry';
import { useRegistryState } from './hooks/useRegistryState';
import type { Product, ProductCategory } from './types/marketplace';

/**
 * Rubric lines are the same for every assessed listing; read labels and maxima from the scorer
 * itself, using the first listing that has an Aegis declaration (open-source ones have none).
 */
const RUBRIC_SOURCE = catalog.find((p) => p.aegis !== null);
const AEGIS_RUBRIC = RUBRIC_SOURCE ? aegisBreakdown(RUBRIC_SOURCE).map(({ label, max }) => ({ label, max })) : [];

function AegisStandard() {
  return (
    <section id="aegis-standard" aria-labelledby="aegis-standard-title" className="border-t border-zf-grid bg-zf-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:px-8">
        <div>
          <h2 id="aegis-standard-title" className="text-2xl font-bold text-zf-text">
            The Aegis standard
          </h2>
          <div className="mt-4 space-y-3 text-zf-muted">
            <p>
              Every assessed listing carries an Aegis score from 0 to 100. It measures transparency, not quality: how much of a
              listing&apos;s behaviour the publisher has declared in a form you can check.
            </p>
            <p>
              Each point comes from a stated fact, such as a decision log you can read, a human approval step before
              irreversible actions, or a written list of what the listing refuses to do. Touching payments, health or
              personal data costs points, because a smaller footprint is easier to trust.
            </p>
            <p>The full breakdown for any listing is one click away in its detail sheet.</p>
            <p>
              Open-source listings are shown for reference and are not scored.
            </p>
          </div>
        </div>
        <ol className="divide-y divide-zf-grid rounded-lg border border-zf-grid bg-zf-canvas">
          {AEGIS_RUBRIC.map((line) => (
            <li key={line.label} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-zf-text">{line.label}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums text-zf-aegis">
                {line.max} pts
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm font-medium text-zf-text">Maximum</span>
            <span className="shrink-0 font-mono text-sm tabular-nums text-zf-aegis">
              {AEGIS_RUBRIC.reduce((sum, l) => sum + l.max, 0)} pts
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}

export default function App() {
  const { filters, setFilters, openListingId, openListing, closeListing } = useRegistryState();
  const [taskFinderOpen, setTaskFinderOpen] = useState(false);

  const openProduct = useMemo(
    () => (openListingId ? catalog.find((p) => p.id === openListingId) ?? null : null),
    [openListingId],
  );

  const setQuery = useCallback((query: string) => setFilters((f) => ({ ...f, query })), [setFilters]);

  const toggleCategory = useCallback(
    (category: ProductCategory) =>
      setFilters((f) => ({
        ...f,
        categories: f.categories.includes(category)
          ? f.categories.filter((c) => c !== category)
          : [...f.categories, category],
      })),
    [setFilters],
  );

  const onOpenProduct = useCallback((p: Product) => openListing(p.id), [openListing]);

  const onOpenFromTaskFinder = useCallback(
    (p: Product) => {
      setTaskFinderOpen(false);
      openListing(p.id);
    },
    [openListing],
  );

  return (
    <div className="min-h-screen bg-zf-canvas text-zf-text">
      <a
        href="#registry"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-zf-raised focus:px-4 focus:py-2 focus:text-zf-text"
      >
        Skip to registry
      </a>

      <ParentStrip />
      <Navbar query={filters.query} onQueryChange={setQuery} onOpenTaskFinder={() => setTaskFinderOpen(true)} />

      <main id="main">
        <Hero
          products={catalog}
          query={filters.query}
          onQueryChange={setQuery}
          activeCategories={filters.categories}
          onToggleCategory={toggleCategory}
          onOpenProduct={onOpenProduct}
          onOpenTaskFinder={() => setTaskFinderOpen(true)}
        />
        <Registry products={catalog} filters={filters} onFiltersChange={setFilters} onOpenProduct={onOpenProduct} />
        <AegisStandard />
      </main>

      <Footer />

      <ListingSheet product={openProduct} products={catalog} onClose={closeListing} onOpenProduct={onOpenProduct} />
      <TaskFinder
        open={taskFinderOpen}
        onClose={() => setTaskFinderOpen(false)}
        products={catalog}
        onOpenProduct={onOpenFromTaskFinder}
      />
    </div>
  );
}
