// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { catalog, inventory } from './index';
import { CATEGORIES, aegisScore } from '../lib/registry';
import datasets from '../../api/_lib/datasets.json';
import { CONNECTORS } from '../../api/_lib/connectors.js';
import { buildN8n } from '../../api/_lib/n8n.js';
import { systemPrompt } from '../../api/_lib/core.js';
import type { Product } from '../types/marketplace';

const DS = datasets as Record<string, { handler: string; params: { name: string; required: boolean }[] }>;
const byCat = (c: string) => inventory.filter((p) => p.category === c);

describe('ZenFlow Master Inventory', () => {
  it('lists 399 assets: 100 agents, 100 workflows, 99 bots (one dropped), 100 databases', () => {
    expect(inventory.length).toBe(399);
    expect(byCat('agents').length).toBe(100);
    expect(byCat('workflows').length).toBe(100);
    expect(byCat('bots').length).toBe(99);
    expect(byCat('databases').length).toBe(100);
  });

  it('uses only known categories', () => {
    const ids = CATEGORIES.map((c) => c.id) as string[];
    for (const p of inventory) expect(ids, p.id).toContain(p.category);
  });

  it('has ids unique across the whole registry', () => {
    const ids = catalog.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('holds every health-scoped listing as pending Vital Helix', () => {
    for (const p of inventory) {
      if (p.scopes.includes('health')) {
        expect(p.publisher, p.id).toBe('Vital Helix');
        expect(p.pending, p.id).toBe(true);
      }
      if (p.pending) expect(p.publisher, p.id).toBe('Vital Helix');
    }
  });

  it('gives every listing an Aegis declaration and a score', () => {
    for (const p of inventory) {
      expect(p.aegis?.refusals.length, p.id).toBeGreaterThan(0);
      expect(aegisScore(p), p.id).not.toBeNull();
    }
  });

  it('points every runtime at its own endpoint', () => {
    const want: Record<string, (p: Product) => string> = {
      agents: (p) => `/api/v1/agents/${p.id}/run`,
      bots: (p) => `/api/v1/bots/${p.id}/chat`,
      workflows: (p) => `/api/v1/workflows/${p.id}/trigger`,
      databases: (p) => `/api/v1/databases/${p.id}`,
    };
    for (const p of inventory) expect(p.runtime?.endpoint, p.id).toBe(want[p.category](p));
  });

  it('backs every database with a real connector and matching parameters', () => {
    for (const p of byCat('databases')) {
      const spec = DS[p.id];
      expect(spec, p.id).toBeDefined();
      expect(CONNECTORS, p.id).toContain(spec.handler);
      if (p.runtime?.kind === 'dataset') expect(p.runtime.params.map((x) => x.name)).toEqual(spec.params.map((x) => x.name));
    }
    expect(Object.keys(DS).length).toBe(100);
  });

  it('builds a connected n8n graph for every workflow, with approval before irreversible steps', () => {
    for (const p of byCat('workflows')) {
      const wf = buildN8n(p);
      const names = new Set(wf.nodes.map((n: { name: string }) => n.name));
      expect(names.size, p.id).toBe(wf.nodes.length);
      // Every node except the last has exactly one outgoing edge to a node that exists.
      expect(Object.keys(wf.connections).length, p.id).toBe(wf.nodes.length - 1);
      for (const [from, c] of Object.entries(wf.connections) as [string, { main: { node: string }[][] }][]) {
        expect(names.has(from), p.id).toBe(true);
        expect(names.has(c.main[0][0].node), p.id).toBe(true);
      }
      const gate = p.aegis?.refusals.find((r) => r.startsWith('Pauses for approval before:'));
      if (gate) expect(wf.nodes.some((n: { type: string }) => n.type === 'n8n-nodes-base.wait'), p.id).toBe(true);
    }
  });

  it('puts the Aegis refusals into every model prompt', () => {
    for (const p of [...byCat('agents'), ...byCat('bots')]) {
      const sys = systemPrompt(p);
      for (const r of p.aegis?.refusals ?? []) expect(sys, p.id).toContain(r);
    }
  });
});
