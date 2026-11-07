import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FilterState, Product } from '@/types/marketplace';
import { DEFAULT_FILTERS } from '@/lib/registry';
import Registry from './Registry';
import Facets from './Facets';

function make(overrides: Partial<Product> & Pick<Product, 'id' | 'title'>): Product {
  return {
    summary: `${overrides.title} summary.`,
    audience: 'Testers.',
    category: 'agents',
    publisher: 'ZenFlow',
    deployedIn: 'Test bench',
    capabilities: [],
    inputs: [],
    outputs: [],
    integrations: [],
    scopes: [],
    pricing: { model: 'free', amount: 0 },
    aegis: { refusals: ['x'], escalations: [], auditLog: false, humanInLoop: false, inspectable: false },
    version: '1.0.0',
    updated: '2026-01-01',
    changelog: [],
    tags: [],
    ...overrides,
  };
}

// Aegis: full declaration = 25+20+15+15+10+15 = 100. Bare = 5 (one refusal) + 15 (no sensitive) = 20.
const full = { refusals: ['a', 'b', 'c'], escalations: ['a', 'b'], auditLog: true, humanInLoop: true, inspectable: true };

const products: Product[] = [
  make({
    id: 'ledger-reconciler',
    title: 'Ledger Reconciler',
    publisher: 'Quantum Ledger',
    scopes: ['payments', 'files'],
    pricing: { model: 'monthly', amount: 89 },
    aegis: full,
  }),
  make({ id: 'inbox-triage', title: 'Inbox Triage', category: 'bots', scopes: ['email'], pricing: { model: 'usage', amount: 4 } }),
  make({ id: 'contract-diff', title: 'Contract Diff', category: 'workflows', publisher: 'Juris Guard', scopes: ['files'], aegis: full }),
];

function setup(filters: Partial<FilterState> = {}, list = products) {
  const onFiltersChange = vi.fn();
  const onOpenProduct = vi.fn();
  const f = { ...DEFAULT_FILTERS, ...filters };
  render(<Registry products={list} filters={f} onFiltersChange={onFiltersChange} onOpenProduct={onOpenProduct} />);
  return { onFiltersChange, onOpenProduct, f };
}

describe('Registry', () => {
  it('renders the heading, result count and one entry per listing', () => {
    setup();
    expect(screen.getByRole('heading', { level: 2, name: 'Registry' })).toBeInTheDocument();
    expect(screen.getByTestId('result-count')).toHaveTextContent('3 of 3 listings');
    const list = screen.getByRole('list', { name: 'Listings' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('zf/agent/ledger-reconciler')).toBeInTheDocument();
    expect(screen.getByText('$89/mo')).toBeInTheDocument();
  });

  it('counts only matching listings when filtered', () => {
    setup({ categories: ['bots'] });
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 of 3 listings');
  });

  it('opens a product when its row is clicked', async () => {
    const { onOpenProduct } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Inbox Triage' }));
    expect(onOpenProduct).toHaveBeenCalledWith(products[1]);
  });

  it('removes a single filter from its chip', async () => {
    const { onFiltersChange, f } = setup({ categories: ['agents', 'bots'], minAegis: 50 });
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Bots' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, categories: ['agents'] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Aegis 50+' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, minAegis: 0 });
  });

  it('clear all resets filters but keeps the sort', async () => {
    const { onFiltersChange } = setup({ categories: ['bots'], excludeScopes: ['pii'], query: 'inbox', sort: 'name' });
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...DEFAULT_FILTERS, sort: 'name' });
  });

  it('changes the sort', async () => {
    const { onFiltersChange, f } = setup();
    await userEvent.selectOptions(screen.getByLabelText('Sort'), 'price-desc');
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, sort: 'price-desc' });
  });

  it('renders listings in the order lib/registry sorts them', () => {
    setup({ sort: 'name' });
    const titles = within(screen.getByRole('list', { name: 'Listings' }))
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['Contract Diff', 'Inbox Triage', 'Ledger Reconciler']);
  });

  it('empty state names filters and offers to remove the most restrictive one', async () => {
    // bots + Aegis 85+ → nothing. Dropping Aegis restores Inbox Triage (1); dropping Bots restores 2.
    const { onFiltersChange, f } = setup({ categories: ['bots'], minAegis: 85 });
    expect(screen.queryByRole('list', { name: 'Listings' })).not.toBeInTheDocument();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('No listings match these filters.');
    expect(status).toHaveTextContent('Active: Bots, Aegis 85+.');
    await userEvent.click(within(status).getByRole('button', { name: /Remove Bots/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, categories: [] });
    expect(within(status).getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
  });

  it('says so when the catalog is empty', () => {
    setup({}, []);
    expect(screen.getByTestId('result-count')).toHaveTextContent('0 of 0 listings');
    expect(screen.getByRole('status')).toHaveTextContent('No listings published yet.');
  });

  it('shows the active facet count on the mobile filters button', () => {
    setup({ categories: ['bots'], publishers: ['Juris Guard'], query: 'x' });
    expect(screen.getByRole('button', { name: /Filters \(2 active\)/ })).toBeInTheDocument();
  });

  it('marks sensitive scopes for assistive tech', () => {
    setup();
    const list = screen.getByRole('list', { name: 'Listings' });
    expect(within(list).getByText('Payments')).toHaveTextContent('Payments (sensitive)');
  });
});

describe('Facets', () => {
  function renderFacets(filters: Partial<FilterState> = {}) {
    const onFiltersChange = vi.fn();
    const f = { ...DEFAULT_FILTERS, ...filters };
    render(<Facets products={products} filters={f} onFiltersChange={onFiltersChange} />);
    return { onFiltersChange, f };
  }

  const group = (name: string) => screen.getByRole('group', { name });

  it('renders each group as a fieldset with counts', () => {
    renderFacets();
    const cat = group('Category');
    expect(within(cat).getByRole('checkbox', { name: /Agents/ }).closest('label')).toHaveTextContent('Agents1');
    expect(within(cat).getByRole('checkbox', { name: /Automations/ })).toBeDisabled();
    expect(within(group('Pricing model')).getByRole('checkbox', { name: /Free/ }).closest('label')).toHaveTextContent('Free1');
    expect(within(group('Publisher')).getAllByRole('checkbox')).toHaveLength(3);
  });

  it('category counts reflect other active filters', () => {
    renderFacets({ pricingModels: ['monthly'] });
    const cat = group('Category');
    expect(within(cat).getByRole('checkbox', { name: /Agents/ }).closest('label')).toHaveTextContent('Agents1');
    expect(within(cat).getByRole('checkbox', { name: /Bots/ })).toBeDisabled();
  });

  it('toggles a category on and off', async () => {
    const { onFiltersChange, f } = renderFacets({ categories: ['agents'] });
    await userEvent.click(within(group('Category')).getByRole('checkbox', { name: /Bots/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, categories: ['agents', 'bots'] });
    await userEvent.click(within(group('Category')).getByRole('checkbox', { name: /Agents/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, categories: [] });
  });

  it('toggles pricing model and publisher', async () => {
    const { onFiltersChange, f } = renderFacets();
    await userEvent.click(within(group('Pricing model')).getByRole('checkbox', { name: /Usage-based/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, pricingModels: ['usage'] });
    await userEvent.click(within(group('Publisher')).getByRole('checkbox', { name: /Juris Guard/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, publishers: ['Juris Guard'] });
  });

  it('excludes a data scope, with the explanation attached to the group', async () => {
    const { onFiltersChange, f } = renderFacets();
    const scopes = group('Exclude data scopes');
    expect(scopes).toHaveAccessibleDescription(/Hide listings that touch/);
    // Two listings touch files.
    expect(within(scopes).getByRole('checkbox', { name: /Files/ }).closest('label')).toHaveTextContent('Files2');
    await userEvent.click(within(scopes).getByRole('checkbox', { name: /Payments/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, excludeScopes: ['payments'] });
  });

  it('minimum Aegis is a segmented control with aria-pressed', async () => {
    const { onFiltersChange, f } = renderFacets({ minAegis: 70 });
    const seg = group('Minimum Aegis score');
    expect(within(seg).getByRole('button', { name: '70+' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(seg).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(within(seg).getByRole('button', { name: '85+' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, minAegis: 85 });
  });
});
