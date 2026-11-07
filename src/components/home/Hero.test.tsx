import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Hero, { heroStats } from './Hero';
import { aegisScore } from '../../lib/registry';
import type { Product } from '../../types/marketplace';

function makeProduct(id: string, over: Partial<Product> = {}): Product {
  return {
    id,
    title: id,
    summary: `${id} summary`,
    audience: 'Teams',
    category: 'agents',
    publisher: 'ZenFlow',
    deployedIn: 'ZenFlow',
    capabilities: [],
    inputs: [],
    outputs: [],
    integrations: [],
    scopes: [],
    pricing: { model: 'free', amount: 0 },
    aegis: { refusals: ['x'], escalations: [], auditLog: true, humanInLoop: false, inspectable: false },
    version: '1.0.0',
    updated: '2026-10-01',
    changelog: [],
    tags: [],
    ...over,
  };
}

const products: Product[] = [
  makeProduct('ledger', {
    title: 'Ledger Reconciler',
    category: 'agents',
    publisher: 'Quantum Ledger',
    integrations: ['Xero'],
    aegis: { refusals: ['a', 'b', 'c'], escalations: ['x', 'y'], auditLog: true, humanInLoop: true, inspectable: true },
  }),
  makeProduct('intake', {
    title: 'Contract Intake',
    category: 'workflows',
    publisher: 'Juris Guard',
    integrations: ['Xero', 'Gmail'],
    aegis: { refusals: ['a'], escalations: [], auditLog: true, humanInLoop: false, inspectable: false },
  }),
  makeProduct('triage', {
    title: 'Ticket Triage',
    category: 'bots',
    publisher: 'Quantum Ledger',
    aegis: { refusals: ['a'], escalations: ['x'], auditLog: false, humanInLoop: true, inspectable: true },
  }),
  makeProduct('sync', {
    title: 'CRM Sync',
    category: 'automations',
    publisher: 'Signal Velocity',
    scopes: ['pii', 'payments'],
    aegis: { refusals: [], escalations: [], auditLog: false, humanInLoop: false, inspectable: false },
  }),
];

function setup(over: Partial<Parameters<typeof Hero>[0]> = {}) {
  const props = {
    products,
    query: '',
    onQueryChange: vi.fn(),
    activeCategories: [],
    onToggleCategory: vi.fn(),
    onOpenProduct: vi.fn(),
    onOpenTaskFinder: vi.fn(),
    ...over,
  };
  const utils = render(<Hero {...props} />);
  return { ...utils, props };
}

describe('heroStats', () => {
  it('computes listings, departments, median Aegis and human-in-loop count', () => {
    const scores = products.map(aegisScore).sort((a, b) => a - b);
    const s = heroStats(products);
    expect(s.listings).toBe(4);
    expect(s.departments).toBe(3);
    expect(s.medianAegis).toBe(Math.round((scores[1] + scores[2]) / 2));
    expect(s.humanInLoop).toBe(2);
  });

  it('handles odd counts and an empty catalog', () => {
    expect(heroStats(products.slice(0, 3)).medianAegis).toBe(
      products.slice(0, 3).map(aegisScore).sort((a, b) => a - b)[1],
    );
    expect(heroStats([])).toEqual({ listings: 0, departments: 0, medianAegis: null, humanInLoop: 0 });
  });
});

describe('Hero', () => {
  it('states what the registry is in the H1', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/published by the teams that run them/i);
  });

  it('renders the stats row from the catalog', () => {
    const { container } = setup();
    const stat = (label: string) => container.querySelector(`[data-stat="${label}"]`)?.textContent;
    expect(stat('Listings')).toBe('4');
    expect(stat('Divisions')).toBe('3');
    expect(stat('Human-in-loop')).toBe('2');
    expect(stat('Median Aegis')).toBe(String(heroStats(products).medianAegis));
  });

  it('search input calls onQueryChange and submit scrolls to #registry', () => {
    const target = document.createElement('div');
    target.id = 'registry';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);
    const { props } = setup();
    const input = screen.getByRole('searchbox', { name: 'Search the registry' });
    fireEvent.change(input, { target: { value: 'invoice' } });
    expect(props.onQueryChange).toHaveBeenCalledWith('invoice');
    fireEvent.submit(input.closest('form')!);
    expect(target.scrollIntoView).toHaveBeenCalled();
    target.remove();
  });

  it('category quick filters show counts, reflect aria-pressed and fire the toggle', () => {
    const { props } = setup({ activeCategories: ['workflows'] });
    const group = screen.getByRole('group', { name: 'Filter by category' });
    const workflows = within(group).getByRole('button', { name: /Workflows/ });
    const agents = within(group).getByRole('button', { name: /Agents/ });
    expect(workflows).toHaveAttribute('aria-pressed', 'true');
    expect(agents).toHaveAttribute('aria-pressed', 'false');
    expect(agents).toHaveTextContent('1');
    fireEvent.click(agents);
    expect(props.onToggleCategory).toHaveBeenCalledWith('agents');
  });

  it('opens the task finder', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Describe a task instead' }));
    expect(props.onOpenTaskFinder).toHaveBeenCalled();
  });

  it('draws one lattice node per product and dims non-matching ones while searching', () => {
    const { container } = setup({ query: 'ledger' });
    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(4);
    expect((container.querySelector('[data-node-id="ledger"]') as SVGGElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="sync"]') as SVGGElement).style.opacity).toBe('0.2');
  });
});
