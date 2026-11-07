import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FilterState, Product } from '@/types/marketplace';
import { DEFAULT_FILTERS } from '@/lib/registry';
import Registry, { VIEW_KEY } from './Registry';
import Facets from './Facets';
import ListingCard from './ListingCard';
import ListingRow from './ListingRow';

function make(overrides: Partial<Product> & Pick<Product, 'id' | 'title'>): Product {
  return {
    summary: `${overrides.title} summary.`,
    audience: 'Testers.',
    category: 'agents',
    source: 'collective',
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

beforeEach(() => {
  window.localStorage.clear();
});

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

describe('Registry view toggle', () => {
  it('defaults to the grid, with cover art on every card', () => {
    setup();
    const seg = screen.getByRole('group', { name: 'View' });
    expect(within(seg).getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(seg).getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'false');
    const list = screen.getByRole('list', { name: 'Listings' });
    expect(list.querySelectorAll('[data-motif]')).toHaveLength(3);
  });

  it('switches to the list, persists the choice and leaves filters alone', async () => {
    const { onFiltersChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    const list = screen.getByRole('list', { name: 'Listings' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(list.querySelectorAll('[data-motif]')).toHaveLength(0);
    expect(window.localStorage.getItem(VIEW_KEY)).toBe('list');
    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it('restores the stored view', () => {
    window.localStorage.setItem(VIEW_KEY, 'list');
    setup();
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('still renders when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    setup();
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
    spy.mockRestore();
  });
});

describe('Registry sources', () => {
  const oss = make({
    id: 'oss-agent',
    title: 'OSS Agent',
    source: 'open-source',
    publisher: 'Open source',
    aegis: null,
    openSource: {
      repo: 'acme/oss-agent',
      url: 'https://github.com/acme/oss-agent',
      license: 'MIT',
      stars: 10,
      language: 'Python',
      pushedAt: '2026-10-01',
      checkedAt: '2026-11-01',
    },
  });
  const service = make({ id: 'svc', title: 'Division Svc', source: 'directory', publisher: 'Nexus Labs', category: 'automations' });

  it('shows a removable chip for each source filter', async () => {
    const { onFiltersChange, f } = setup({ sources: ['open-source', 'directory'] }, [...products, oss, service]);
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Open source' }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, sources: ['directory'] });
    expect(screen.getByRole('button', { name: 'Remove filter: Division service' })).toBeInTheDocument();
  });

  it('empty state can offer to drop the source filter', async () => {
    // Open source + Aegis 50+ → nothing (open source is never scored). Dropping the
    // source restores 2; dropping Aegis restores 1.
    const { onFiltersChange, f } = setup({ sources: ['open-source'], minAegis: 50 }, [...products, oss]);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Active: Open source, Aegis 50+.');
    await userEvent.click(within(status).getByRole('button', { name: /Remove Open source/ }));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...f, sources: [] });
  });

  it('list rows show the source badge and "Not assessed"', () => {
    render(
      <ul>
        <ListingRow product={oss} onOpen={() => {}} />
        <ListingRow product={service} onOpen={() => {}} />
      </ul>,
    );
    const [ossRow, svcRow] = screen.getAllByRole('listitem');
    expect(ossRow).toHaveTextContent('Not assessed');
    expect(ossRow).toHaveTextContent('acme/oss-agent');
    expect(within(ossRow).getByText('Open source')).toBeInTheDocument();
    expect(within(ossRow).queryByRole('meter')).not.toBeInTheDocument();
    expect(within(svcRow).getByText('Division service')).toBeInTheDocument();
    expect(within(svcRow).getByRole('meter')).toBeInTheDocument();
  });
});

describe('ListingCard', () => {
  const oss = make({ id: 'oss-bot', title: 'OSS Bot', category: 'bots', source: 'open-source', publisher: 'Open source', aegis: null });

  it('shows the id, title, price, Aegis meter and no badge for a division-run listing', async () => {
    const onOpen = vi.fn();
    render(
      <ul>
        <ListingCard product={products[0]} onOpen={onOpen} />
      </ul>,
    );
    const card = screen.getByRole('listitem');
    expect(card).toHaveTextContent('zf/agent/ledger-reconciler');
    expect(card).toHaveTextContent('$89/mo');
    expect(within(card).getByRole('meter')).toHaveAttribute('aria-valuenow', '95'); // full declaration, one sensitive scope
    expect(within(card).queryByText('Open source')).not.toBeInTheDocument();
    expect(within(card).queryByText('Division service')).not.toBeInTheDocument();
    expect(card.querySelector('[data-motif="lattice"]')).not.toBeNull();
    await userEvent.click(within(card).getByRole('button', { name: 'Ledger Reconciler' }));
    expect(onOpen).toHaveBeenCalledWith(products[0]);
  });

  it('says "Not assessed" and badges an open-source listing', () => {
    render(
      <ul>
        <ListingCard product={oss} onOpen={() => {}} />
      </ul>,
    );
    const card = screen.getByRole('listitem');
    expect(card).toHaveTextContent('Not assessed');
    expect(within(card).queryByRole('meter')).not.toBeInTheDocument();
    // Publisher "Open source" with no repo is not printed twice: the badge alone says it.
    expect(within(card).getAllByText('Open source')).toHaveLength(1);
    expect(card.querySelector('[data-palette="open-source"]')).not.toBeNull();
    // The card has exactly one interactive element.
    expect(within(card).getAllByRole('button')).toHaveLength(1);
  });

  it('badges a division service', () => {
    render(
      <ul>
        <ListingCard product={make({ id: 's', title: 'S', source: 'directory', publisher: 'Nexus Labs' })} onOpen={() => {}} />
      </ul>,
    );
    expect(screen.getByText('Division service')).toBeInTheDocument();
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
