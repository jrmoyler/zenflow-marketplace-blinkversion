import type { Product } from '../types/marketplace';

/** STUB — the data agent replaces this file with the full curated catalog. */
export const catalog: Product[] = [
  {
    id: 'ledger-reconciler',
    title: 'Ledger Reconciler',
    summary: 'Matches bank feeds against open invoices and flags every line it cannot explain.',
    audience: 'Finance teams closing books monthly on Xero or QuickBooks.',
    category: 'agents',
    publisher: 'Quantum Ledger',
    deployedIn: 'Quantum Ledger month-end close',
    capabilities: ['Three-way match bank, invoice, PO', 'Explains each unmatched line', 'Drafts journal entries for review'],
    inputs: ['Bank feed (CSV or Plaid)', 'Open invoices'],
    outputs: ['Reconciliation report', 'Draft journal entries'],
    integrations: ['Xero', 'QuickBooks', 'Plaid'],
    scopes: ['payments', 'files'],
    pricing: { model: 'monthly', amount: 89 },
    aegis: {
      refusals: ['Never posts a journal entry without approval', 'Never moves money'],
      escalations: ['Variance above the set threshold'],
      auditLog: true,
      humanInLoop: true,
      inspectable: true,
    },
    version: '2.4.1',
    updated: '2026-10-28',
    changelog: [{ version: '2.4.1', date: '2026-10-28', note: 'Handles multi-currency invoices.' }],
    tags: ['finance', 'accounting', 'reconciliation'],
    featured: true,
  },
];
