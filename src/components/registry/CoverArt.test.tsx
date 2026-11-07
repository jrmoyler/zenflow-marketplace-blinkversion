import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Product, ProductCategory } from '@/types/marketplace';
import { catalog } from '@/data';
import CoverArt, { MOTIFS, paletteFor } from './CoverArt';

function make(overrides: Partial<Product> & Pick<Product, 'id'>): Product {
  return {
    title: overrides.id,
    summary: 's',
    audience: 'a',
    category: 'agents',
    source: 'collective',
    publisher: 'ZenFlow',
    deployedIn: 'Test bench',
    capabilities: ['a', 'b', 'c'],
    inputs: ['i1', 'i2'],
    outputs: ['o1'],
    integrations: ['x', 'y'],
    scopes: ['email'],
    pricing: { model: 'free', amount: 0 },
    aegis: null,
    version: '1.0.0',
    updated: '2026-01-01',
    changelog: [],
    tags: [],
    ...overrides,
  };
}

const CATEGORIES: ProductCategory[] = ['agents', 'workflows', 'automations', 'bots'];

/** Every SVG element drawn by the art, including the publisher mark tile. */
function elementCount(container: HTMLElement): number {
  return container.querySelectorAll('svg, svg *').length;
}

describe('CoverArt', () => {
  it('is deterministic: the same listing renders identical markup', () => {
    for (const category of CATEGORIES) {
      const p = make({ id: `same-${category}`, category });
      expect(renderToStaticMarkup(<CoverArt product={p} />)).toBe(renderToStaticMarkup(<CoverArt product={{ ...p }} />));
      expect(renderToStaticMarkup(<CoverArt product={p} variant="sheet" />)).toBe(
        renderToStaticMarkup(<CoverArt product={p} variant="sheet" />),
      );
    }
  });

  it('different listings get different art', () => {
    const a = renderToStaticMarkup(<CoverArt product={make({ id: 'alpha' })} />);
    const b = renderToStaticMarkup(<CoverArt product={make({ id: 'beta' })} />);
    expect(a).not.toBe(b);
  });

  it('draws the motif that belongs to the category', () => {
    for (const category of CATEGORIES) {
      const { container, unmount } = render(<CoverArt product={make({ id: `m-${category}`, category })} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveAttribute('data-motif', MOTIFS[category]);
      unmount();
    }
    expect(new Set(Object.values(MOTIFS)).size).toBe(4);
  });

  it('is decorative', () => {
    const { container } = render(<CoverArt product={make({ id: 'deco' })} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveAttribute('role', 'presentation');
    expect(container.querySelector('text')).toBeNull();
    expect(container.querySelector('filter')).toBeNull();
    expect(container.querySelector('animate, animateTransform, animateMotion')).toBeNull();
  });

  it('uses the card and sheet aspect ratios', () => {
    const card = render(<CoverArt product={make({ id: 'r' })} />).container.firstElementChild as HTMLElement;
    expect(card.className).toContain('aspect-[16/9]');
    expect(card.querySelector('svg')).toHaveAttribute('viewBox', '0 0 320 180');
    const sheet = render(<CoverArt product={make({ id: 'r' })} variant="sheet" className="x-extra" />).container
      .firstElementChild as HTMLElement;
    expect(sheet.className).toContain('aspect-[3/1]');
    expect(sheet.className).toContain('x-extra');
    expect(sheet.querySelector('svg')).toHaveAttribute('viewBox', '0 0 480 160');
  });

  it('colours division listings by division and open source in silver and blue', () => {
    const division = make({ id: 'colour', publisher: 'Nexus Labs' });
    const oss = make({ id: 'colour', publisher: 'Open source', source: 'open-source' });
    expect(paletteFor(division).key).toBe('nexus-labs');
    expect(paletteFor(oss)).toMatchObject({ key: 'open-source', primary: '#94A3B8', accent: '#3B82F6' });
    expect(paletteFor(division).primary).not.toBe(paletteFor(oss).primary);

    const d = render(<CoverArt product={division} />).container;
    expect(d.firstElementChild).toHaveAttribute('data-palette', 'nexus-labs');
    expect(d.querySelector('[data-mark="nexus-labs"]')).not.toBeNull();
    expect(d.innerHTML).toContain('#DC2626');

    const o = render(<CoverArt product={oss} />).container;
    expect(o.firstElementChild).toHaveAttribute('data-palette', 'open-source');
    expect(o.querySelector('[data-mark="open-source"]')).not.toBeNull();
    expect(o.innerHTML).not.toContain('#DC2626');
    expect(o.innerHTML).toContain('#3B82F6');
  });

  it('directory listings published by a division keep the division palette', () => {
    expect(paletteFor(make({ id: 'd', source: 'directory', publisher: 'Juris Guard' })).key).toBe('juris-guard');
  });

  it('stays under ~120 SVG elements for the largest catalog listing in every category', () => {
    const big = make({
      id: 'everything',
      capabilities: Array.from({ length: 20 }, (_, i) => `c${i}`),
      inputs: Array.from({ length: 10 }, (_, i) => `i${i}`),
      outputs: Array.from({ length: 10 }, (_, i) => `o${i}`),
      integrations: Array.from({ length: 20 }, (_, i) => `x${i}`),
      scopes: ['email', 'calendar', 'crm', 'files', 'payments', 'pii', 'health', 'code', 'public-web', 'chat'],
    });
    const largest = [...catalog].sort(
      (a, b) =>
        b.capabilities.length + b.integrations.length + b.scopes.length + b.inputs.length + b.outputs.length -
        (a.capabilities.length + a.integrations.length + a.scopes.length + a.inputs.length + a.outputs.length),
    );
    const subjects = [...CATEGORIES.map((category) => ({ ...big, category })), ...largest.slice(0, 5)];
    for (const p of subjects) {
      for (const variant of ['card', 'sheet'] as const) {
        const { container, unmount } = render(<CoverArt product={p} variant={variant} />);
        expect(elementCount(container)).toBeLessThanOrEqual(120);
        unmount();
      }
    }
  });

  it('renders every catalog listing without throwing', () => {
    for (const p of catalog) {
      expect(() => renderToStaticMarkup(<CoverArt product={p} />)).not.toThrow();
    }
  });
});
