import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { parseQuery, serializeQuery, useRegistryState } from './useRegistryState';
import { DEFAULT_FILTERS } from '../lib/registry';
import type { FilterState } from '../types/marketplace';

const full: FilterState = {
  query: 'reconcile invoices',
  categories: ['agents', 'bots'],
  pricingModels: ['free', 'monthly'],
  excludeScopes: ['pii', 'health'],
  publishers: ['Juris Guard', 'Quantum Ledger'],
  sources: ['collective', 'open-source'],
  minAegis: 70,
  sort: 'updated',
};

describe('serializeQuery', () => {
  it('returns an empty string for defaults', () => {
    expect(serializeQuery(DEFAULT_FILTERS, null)).toBe('');
  });

  it('omits default values and keeps only the changed ones', () => {
    const s = serializeQuery({ ...DEFAULT_FILTERS, minAegis: 40 }, null);
    expect(s).toBe('?aegis=40');
    expect(s).not.toContain('sort=');
    expect(s).not.toContain('q=');
  });

  it('encodes the documented shape', () => {
    expect(serializeQuery(full, 'ledger-reconciler')).toBe(
      '?q=reconcile%20invoices&cat=agents,bots&price=free,monthly&noscope=pii,health' +
        '&pub=Juris%20Guard,Quantum%20Ledger&src=collective,open-source&aegis=70&sort=updated&listing=ledger-reconciler',
    );
  });

  it('omits a whitespace-only query', () => {
    expect(serializeQuery({ ...DEFAULT_FILTERS, query: '   ' }, null)).toBe('');
  });
});

describe('parseQuery', () => {
  it('round-trips every field', () => {
    const parsed = parseQuery(serializeQuery(full, 'ledger-reconciler'));
    expect(parsed.filters).toEqual(full);
    expect(parsed.listingId).toBe('ledger-reconciler');
  });

  it('round-trips defaults', () => {
    expect(parseQuery(serializeQuery(DEFAULT_FILTERS, null))).toEqual({ filters: DEFAULT_FILTERS, listingId: null });
  });

  it('accepts + as a space (form encoding)', () => {
    expect(parseQuery('?pub=Juris+Guard').filters.publishers).toEqual(['Juris Guard']);
  });

  it('parses sources and the open-source publisher', () => {
    const { filters } = parseQuery('?src=collective,directory,open-source,vendor,directory&pub=Open%20source');
    expect(filters.sources).toEqual(['collective', 'directory', 'open-source']);
    expect(filters.publishers).toEqual(['Open source']);
    expect(serializeQuery(filters, null)).toBe('?pub=Open%20source&src=collective,directory,open-source');
  });

  it('falls back to defaults for an empty or garbage string', () => {
    expect(parseQuery('').filters).toEqual(DEFAULT_FILTERS);
    expect(parseQuery('?%%%&&==').filters).toEqual(DEFAULT_FILTERS);
  });

  it('drops unknown values and duplicates', () => {
    const { filters } = parseQuery(
      '?cat=agents,spaceships,agents&price=free,lifetime&noscope=pii,dna&pub=Juris%20Guard,Acme&sort=random',
    );
    expect(filters.categories).toEqual(['agents']);
    expect(filters.pricingModels).toEqual(['free']);
    expect(filters.excludeScopes).toEqual(['pii']);
    expect(filters.publishers).toEqual(['Juris Guard']);
    expect(filters.sort).toBe(DEFAULT_FILTERS.sort);
  });

  it('clamps aegis to 0–100 and ignores non-numbers', () => {
    expect(parseQuery('?aegis=250').filters.minAegis).toBe(100);
    expect(parseQuery('?aegis=-5').filters.minAegis).toBe(0);
    expect(parseQuery('?aegis=abc').filters.minAegis).toBe(0);
    expect(parseQuery('?aegis=62.6').filters.minAegis).toBe(63);
  });

  it('rejects malformed listing ids', () => {
    expect(parseQuery('?listing=').listingId).toBeNull();
    expect(parseQuery('?listing=%3Cscript%3E').listingId).toBeNull();
    expect(parseQuery('?listing=ledger-reconciler').listingId).toBe('ledger-reconciler');
  });
});

describe('useRegistryState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('reads initial state from the URL', () => {
    window.history.replaceState(null, '', '/?cat=bots&listing=ledger-reconciler');
    const { result } = renderHook(() => useRegistryState());
    expect(result.current.filters.categories).toEqual(['bots']);
    expect(result.current.openListingId).toBe('ledger-reconciler');
  });

  it('replaces history for filter edits and pushes for listings', () => {
    const { result } = renderHook(() => useRegistryState());
    const start = window.history.length;

    act(() => result.current.setFilters((f) => ({ ...f, query: 'l' })));
    act(() => result.current.setFilters((f) => ({ ...f, query: 'le' })));
    expect(window.location.search).toBe('?q=le');
    expect(window.history.length).toBe(start);

    act(() => result.current.openListing('ledger-reconciler'));
    expect(window.location.search).toBe('?q=le&listing=ledger-reconciler');
    expect(window.history.length).toBe(start + 1);

    act(() => result.current.closeListing());
    expect(window.location.search).toBe('?q=le');
    expect(result.current.openListingId).toBeNull();
  });

  it('follows popstate', () => {
    const { result } = renderHook(() => useRegistryState());
    act(() => {
      window.history.pushState(null, '', '/?aegis=50&listing=ledger-reconciler');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.filters.minAegis).toBe(50);
    expect(result.current.openListingId).toBe('ledger-reconciler');
  });
});
