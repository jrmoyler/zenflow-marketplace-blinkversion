/**
 * App wiring tests. Child components are replaced by thin stubs that honour their
 * prop contracts, so these tests cover App's job only: one registry state, synced
 * to the URL, shared by nav, hero, registry, listing sheet and task finder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { catalog } from './data/catalog';
import { DEFAULT_FILTERS, filterProducts } from './lib/registry';
import type { FilterState, Product } from './types/marketplace';

vi.mock('./components/layout/Navbar', () => ({
  default: ({ query, onQueryChange, onOpenTaskFinder }: any) => (
    <nav data-testid="navbar">
      <input aria-label="Search registry" value={query} onChange={(e) => onQueryChange(e.target.value)} />
      <button onClick={onOpenTaskFinder}>Find by task</button>
    </nav>
  ),
}));

vi.mock('./components/layout/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

vi.mock('./components/home/Hero', () => ({
  default: ({ products, activeCategories, onToggleCategory }: any) => (
    <section data-testid="hero">
      <span data-testid="hero-count">{products.length}</span>
      <span data-testid="hero-active">{activeCategories.join(',')}</span>
      <button onClick={() => onToggleCategory('bots')}>Toggle bots</button>
    </section>
  ),
}));

vi.mock('./components/registry/Registry', async () => {
  const { filterProducts: filter } = await vi.importActual<typeof import('./lib/registry')>('./lib/registry');
  return {
    default: ({ products, filters, onOpenProduct }: { products: Product[]; filters: FilterState; onOpenProduct: (p: Product) => void }) => {
      const results = filter(products, filters);
      return (
        <section id="registry" data-testid="registry">
          <span data-testid="result-count">{results.length}</span>
          {results.map((p) => (
            <button key={p.id} data-testid={`row-${p.id}`} onClick={() => onOpenProduct(p)}>
              {p.title}
            </button>
          ))}
        </section>
      );
    },
  };
});

vi.mock('./components/registry/ListingSheet', () => ({
  default: ({ product, onClose }: any) =>
    product ? (
      <div role="dialog" aria-label={product.title} data-testid="listing-sheet">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock('./components/registry/TaskFinder', () => ({
  default: ({ open, products, onOpenProduct }: any) =>
    open ? (
      <div data-testid="task-finder">
        <button onClick={() => onOpenProduct(products[0])}>Pick first</button>
      </div>
    ) : null,
}));

const first = catalog[0];

function popTo(url: string) {
  act(() => {
    window.history.pushState(null, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders hero, registry, aegis standard and footer with the full catalog', () => {
    render(<App />);
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('hero-count')).toHaveTextContent(String(catalog.length));
    expect(screen.getByTestId('registry')).toBeInTheDocument();
    expect(screen.getByTestId('result-count')).toHaveTextContent(String(catalog.length));
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(document.querySelector('main#main #registry')).not.toBeNull();
  });

  it('puts a skip link to the registry first in the tab order', () => {
    const { container } = render(<App />);
    const skip = screen.getByRole('link', { name: 'Skip to registry' });
    expect(skip).toHaveAttribute('href', '#registry');
    const firstFocusable = container.querySelector('a[href], button, input, select, textarea, [tabindex]');
    expect(firstFocusable).toBe(skip);
  });

  it('renders the Aegis standard section with every rubric line', () => {
    render(<App />);
    const section = document.getElementById('aegis-standard');
    expect(section).not.toBeNull();
    const items = section!.querySelectorAll('ol > li');
    // six rubric lines + the total
    expect(items.length).toBe(7);
    expect(section!.textContent).toContain('100 pts');
  });

  it('typing in search narrows results and writes ?q= with replaceState', () => {
    render(<App />);
    const lengthBefore = window.history.length;
    const term = first.title.toLowerCase();
    fireEvent.change(screen.getByLabelText('Search registry'), { target: { value: term } });

    const expected = filterProducts(catalog, { ...DEFAULT_FILTERS, query: term }).length;
    expect(expected).toBeGreaterThan(0);
    expect(screen.getByTestId('result-count')).toHaveTextContent(String(expected));
    expect(screen.getByTestId(`row-${first.id}`)).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('q')).toBe(term);
    expect(window.history.length).toBe(lengthBefore);

    fireEvent.change(screen.getByLabelText('Search registry'), { target: { value: 'zzqx-no-such-listing' } });
    expect(screen.getByTestId('result-count')).toHaveTextContent('0');
  });

  it('hero category toggle updates filters and the URL', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Toggle bots'));
    expect(screen.getByTestId('hero-active')).toHaveTextContent('bots');
    expect(window.location.search).toBe('?cat=bots');
    fireEvent.click(screen.getByText('Toggle bots'));
    expect(screen.getByTestId('hero-active')).toHaveTextContent('');
    expect(window.location.search).toBe('');
  });

  it('opening a listing pushes ?listing= and shows the sheet; Back closes it', () => {
    render(<App />);
    expect(screen.queryByTestId('listing-sheet')).toBeNull();
    const lengthBefore = window.history.length;

    fireEvent.click(screen.getByTestId(`row-${first.id}`));
    expect(new URLSearchParams(window.location.search).get('listing')).toBe(first.id);
    expect(window.history.length).toBe(lengthBefore + 1);
    expect(screen.getByRole('dialog', { name: first.title })).toBeInTheDocument();

    popTo('/');
    expect(screen.queryByTestId('listing-sheet')).toBeNull();
  });

  it('closing the sheet clears ?listing=', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId(`row-${first.id}`));
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('listing-sheet')).toBeNull();
    expect(new URLSearchParams(window.location.search).get('listing')).toBeNull();
  });

  it('deep link with ?listing=<id> opens the sheet on load', () => {
    window.history.replaceState(null, '', `/?listing=${first.id}`);
    render(<App />);
    expect(screen.getByRole('dialog', { name: first.title })).toBeInTheDocument();
  });

  it('deep link with an unknown listing id keeps the sheet closed', () => {
    window.history.replaceState(null, '', '/?listing=does-not-exist');
    render(<App />);
    expect(screen.queryByTestId('listing-sheet')).toBeNull();
  });

  it('deep link restores filters', () => {
    window.history.replaceState(null, '', `/?q=${encodeURIComponent('zzqx-no-such-listing')}`);
    render(<App />);
    expect(screen.getByLabelText('Search registry')).toHaveValue('zzqx-no-such-listing');
    expect(screen.getByTestId('result-count')).toHaveTextContent('0');
  });

  it('task finder opens from the nav and hands off to the listing sheet', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Find by task'));
    fireEvent.click(screen.getByText('Pick first'));
    expect(screen.queryByTestId('task-finder')).toBeNull();
    expect(screen.getByRole('dialog', { name: first.title })).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('listing')).toBe(first.id);
  });
});
