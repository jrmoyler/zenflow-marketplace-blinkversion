import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Lattice, { computeLattice, LATTICE_W, LATTICE_H, UNASSESSED_RADIUS } from './Lattice';
import type { Product, ProductCategory } from '../../types/marketplace';

function makeProduct(id: string, over: Partial<Product> = {}): Product {
  return {
    id,
    title: id.replace(/-/g, ' '),
    summary: `${id} summary`,
    audience: 'Teams',
    category: 'agents',
    source: 'collective',
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

const CATS: ProductCategory[] = ['agents', 'workflows', 'automations', 'bots'];
const INTEGRATIONS = ['Slack', 'Gmail', 'Notion', 'Xero', 'GitHub', 'Stripe', 'HubSpot'];

function catalogOf(n: number): Product[] {
  return Array.from({ length: n }, (_, i) =>
    makeProduct(`listing-${i}`, {
      category: CATS[i % 4],
      integrations: [INTEGRATIONS[i % 7], INTEGRATIONS[(i * 3) % 7]],
      aegis: { refusals: ['a', 'b'], escalations: ['e'], auditLog: i % 2 === 0, humanInLoop: i % 3 === 0, inspectable: true },
    }),
  );
}

describe('Lattice', () => {
  it('renders one keyboard-reachable node per product, with a title', () => {
    const products = catalogOf(9);
    const { container } = render(<Lattice products={products} />);
    const nodes = container.querySelectorAll('[data-node-id]');
    expect(nodes).toHaveLength(9);
    nodes.forEach((n) => {
      expect(n.getAttribute('tabindex')).toBe('0');
      expect(n.getAttribute('role')).toBe('button');
      expect(n.getAttribute('aria-label')).toBeTruthy();
      expect(n.querySelector('title')?.textContent).toBeTruthy();
    });
  });

  it('renders category labels as pressable buttons that fire onSelectCategory', () => {
    const onSelectCategory = vi.fn();
    render(<Lattice products={catalogOf(8)} activeCategories={['bots']} onSelectCategory={onSelectCategory} />);
    const bots = screen.getByRole('button', { name: /^Bots, 2 listings/ });
    expect(bots).toHaveAttribute('aria-pressed', 'true');
    const agents = screen.getByRole('button', { name: /^Agents, 2 listings/ });
    expect(agents).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(agents);
    fireEvent.keyDown(agents, { key: 'Enter' });
    expect(onSelectCategory).toHaveBeenCalledTimes(2);
    expect(onSelectCategory).toHaveBeenCalledWith('agents');
  });

  it('opens a product on click and on Space', () => {
    const onSelectProduct = vi.fn();
    const products = catalogOf(4);
    const { container } = render(<Lattice products={products} onSelectProduct={onSelectProduct} />);
    const node = container.querySelector('[data-node-id="listing-1"]')!;
    fireEvent.click(node);
    fireEvent.keyDown(node, { key: ' ' });
    expect(onSelectProduct).toHaveBeenCalledTimes(2);
    expect(onSelectProduct.mock.calls[0][0].id).toBe('listing-1');
  });

  it('dims nodes outside highlightIds', () => {
    const { container } = render(<Lattice products={catalogOf(4)} highlightIds={new Set(['listing-0'])} />);
    const lit = container.querySelector('[data-node-id="listing-0"]') as SVGGElement;
    const dim = container.querySelector('[data-node-id="listing-2"]') as SVGGElement;
    expect(lit.style.opacity).toBe('1');
    expect(dim.style.opacity).toBe('0.2');
  });

  it('is deterministic and independent of input order', () => {
    const products = catalogOf(36);
    const a = computeLattice(products);
    const b = computeLattice(products);
    const c = computeLattice([...products].reverse());
    const coords = (l: ReturnType<typeof computeLattice>) =>
      Object.fromEntries(l.nodes.map((n) => [n.id, [n.x, n.y, n.r]]));
    expect(coords(a)).toEqual(coords(b));
    expect(coords(a)).toEqual(coords(c));
    expect(a.edges.map((e) => e.key).sort()).toEqual(c.edges.map((e) => e.key).sort());
  });

  it('keeps nodes inside the viewBox and caps edges at 1.5x node count for 1..60 listings', () => {
    for (const n of [1, 2, 7, 36, 60]) {
      const l = computeLattice(catalogOf(n));
      expect(l.nodes).toHaveLength(n);
      expect(l.edges.length).toBeLessThanOrEqual(Math.round(n * 1.5));
      for (const node of l.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(0);
        expect(node.x).toBeLessThanOrEqual(LATTICE_W);
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y).toBeLessThanOrEqual(LATTICE_H);
      }
    }
  });

  it('keeps every node inside the viewBox for ~130 listings with a third unassessed, edges capped', () => {
    for (const n of [90, 130]) {
      const products = catalogOf(n).map((p, i) =>
        i % 3 === 0 ? { ...p, source: 'open-source' as const, publisher: 'Open source' as const, aegis: null } : p,
      );
      const l = computeLattice(products);
      expect(l.nodes).toHaveLength(n);
      expect(l.edges.length).toBeLessThanOrEqual(Math.round(n * 1.5));
      for (const node of l.nodes) {
        expect(node.x - node.r).toBeGreaterThanOrEqual(0);
        expect(node.x + node.r).toBeLessThanOrEqual(LATTICE_W);
        expect(node.y - node.r).toBeGreaterThanOrEqual(0);
        expect(node.y + node.r).toBeLessThanOrEqual(LATTICE_H);
      }
      // No two nodes land on the same point.
      const points = new Set(l.nodes.map((node) => `${node.x},${node.y}`));
      expect(points.size).toBe(n);
      // Clusters stay clear of their labels.
      for (const c of l.clusters) {
        expect(c.labelY).toBeGreaterThanOrEqual(0);
        expect(c.labelY).toBeLessThanOrEqual(LATTICE_H);
      }
    }
  });

  it('draws unassessed listings as small hollow rings on the outside of their cluster', () => {
    const products = [
      makeProduct('scored'),
      makeProduct('oss', { source: 'open-source', publisher: 'Open source', aegis: null }),
    ];
    const l = computeLattice(products);
    const oss = l.nodes.find((n) => n.id === 'oss')!;
    expect(oss.score).toBeNull();
    expect(oss.r).toBe(UNASSESSED_RADIUS);
    expect(l.nodes[0].id).toBe('scored');

    const { container } = render(<Lattice products={products} />);
    const node = container.querySelector('[data-node-id="oss"]')!;
    expect(node.getAttribute('data-assessed')).toBe('false');
    expect(node.getAttribute('aria-label')).toMatch(/not assessed/);
    expect(node.getAttribute('aria-label')).not.toMatch(/Aegis/);
    const ring = node.querySelector('[data-hollow="true"]')!;
    expect(ring.getAttribute('fill')).toBe('none');
    expect(container.querySelector('[data-node-id="scored"] [data-hollow]')).toBeNull();
  });

  it('only joins listings that share an integration, and scales radius with Aegis', () => {
    const products = [
      makeProduct('a', { integrations: ['Slack'] }),
      makeProduct('b', { integrations: ['slack', 'Gmail'], category: 'workflows' }),
      makeProduct('c', { integrations: ['Xero'], aegis: { refusals: [], escalations: [], auditLog: false, humanInLoop: false, inspectable: false } }),
    ];
    const l = computeLattice(products);
    expect(l.edges.map((e) => e.key)).toEqual(['a--b']);
    const r = Object.fromEntries(l.nodes.map((n) => [n.id, n.r]));
    expect(r.a).toBeGreaterThan(r.c);
  });
});
