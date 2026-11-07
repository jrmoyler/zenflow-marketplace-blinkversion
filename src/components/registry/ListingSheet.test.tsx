import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import ListingSheet from './ListingSheet';
import { aegisScore } from '@/lib/registry';
import type { Product } from '@/types/marketplace';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

function make(overrides: Partial<Product> & Pick<Product, 'id' | 'title'>): Product {
  return {
    summary: `${overrides.title} does one job.`,
    audience: 'Operators.',
    category: 'agents',
    publisher: 'ZenFlow',
    deployedIn: 'ZenFlow ops',
    capabilities: ['Does a thing'],
    inputs: ['Input A'],
    outputs: ['Output B'],
    integrations: [],
    scopes: [],
    pricing: { model: 'free', amount: 0 },
    aegis: { refusals: ['Never deletes data'], escalations: [], auditLog: false, humanInLoop: false, inspectable: false },
    version: '1.0.0',
    updated: '2026-01-01',
    changelog: [{ version: '1.0.0', date: '2026-01-01', note: 'First release.' }],
    tags: [],
    ...overrides,
  };
}

const ledger = make({
  id: 'ledger-reconciler',
  title: 'Ledger Reconciler',
  summary: 'Matches bank feeds against open invoices.',
  audience: 'Finance teams closing books monthly.',
  deployedIn: 'Quantum Ledger month-end close',
  publisher: 'Quantum Ledger',
  capabilities: ['Three-way match bank, invoice, PO', 'Explains each unmatched line'],
  inputs: ['Bank feed (CSV or Plaid)'],
  outputs: ['Reconciliation report'],
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
  changelog: [
    { version: '2.4.1', date: '2026-10-28', note: 'Handles multi-currency invoices.' },
    { version: '2.4.0', date: '2026-09-02', note: 'Plaid support.' },
  ],
  tags: ['finance', 'accounting', 'reconciliation'],
});
const invoiceChaser = make({ id: 'invoice-chaser', title: 'Invoice Chaser', tags: ['finance', 'accounting'], integrations: ['Xero'] });
const payrollBot = make({ id: 'payroll-bot', title: 'Payroll Bot', category: 'bots', tags: ['finance'] });
const taxPrep = make({ id: 'tax-prep', title: 'Tax Prep', tags: ['finance'], integrations: [] });
const poster = make({ id: 'poster', title: 'Social Poster', tags: ['social'] });
const products = [ledger, invoiceChaser, payrollBot, taxPrep, poster];

function setup(product: Product | null = ledger) {
  const onClose = vi.fn();
  const onOpenProduct = vi.fn();
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  render(<ListingSheet product={product} products={products} onClose={onClose} onOpenProduct={onOpenProduct} />);
  return { onClose, onOpenProduct, user, writeText };
}

describe('ListingSheet', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when no product is selected', () => {
    setup(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the header and every section in order', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Ledger Reconciler' });
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Ledger Reconciler' })).toBeInTheDocument();
    expect(within(dialog).getByText('zf/agent/ledger-reconciler')).toBeInTheDocument();
    expect(within(dialog).getAllByText('2.4.1').length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText('Oct 28, 2026').length).toBeGreaterThan(0);
    expect(within(dialog).getByText('Quantum Ledger')).toBeInTheDocument();
    expect(within(dialog).getByText('Finance teams closing books monthly.')).toBeInTheDocument();
    expect(within(dialog).getByText('Quantum Ledger month-end close')).toBeInTheDocument();

    const headings = within(dialog)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(headings).toEqual([
      'Capabilities',
      'Inputs and outputs',
      'Integrations',
      'Data scopes',
      'Aegis report',
      'Pricing',
      'Changelog',
      'Install',
      'Similar listings',
    ]);
    expect(within(dialog).getByText('$89/mo')).toBeInTheDocument();
    expect(within(dialog).getByText('Monthly')).toBeInTheDocument();
    expect(within(dialog).getByText('Pricing is provisional during internal validation.')).toBeInTheDocument();
    expect(within(dialog).getByText('Plaid support.')).toBeInTheDocument();
  });

  it('marks sensitive data scopes', () => {
    setup();
    const scopes = screen.getByRole('list', { name: 'Data scopes' });
    const items = within(scopes).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('paymentssensitive');
    expect(items[1]).toHaveTextContent(/^files$/);
  });

  it('lists refusals and escalations in the Aegis report', () => {
    setup();
    const report = document.getElementById('aegis-report')!;
    const refusals = within(report).getByRole('list', { name: 'Will not' });
    expect(within(refusals).getAllByRole('listitem').map((li) => li.textContent)).toEqual(ledger.aegis.refusals);
    const escalations = within(report).getByRole('list', { name: 'Hands off to a human when' });
    expect(within(escalations).getByText('Variance above the set threshold')).toBeInTheDocument();
    expect(within(report).getByRole('meter')).toHaveAttribute('aria-valuenow', String(aegisScore(ledger)));
  });

  it('rubric rows sum to the Aegis score', () => {
    setup();
    const rows = screen.getAllByTestId('rubric-row');
    expect(rows).toHaveLength(6);
    const sum = rows.reduce((acc, row) => {
      const m = row.textContent!.match(/(\d+)\/(\d+)/);
      return acc + Number(m![1]);
    }, 0);
    expect(sum).toBe(aegisScore(ledger));
    expect(screen.getByTestId('rubric-total')).toHaveTextContent(`${aegisScore(ledger)}/100`);
  });

  it('copies the install command to the clipboard', async () => {
    const { writeText } = setup();
    expect(screen.getByTestId('install-command')).toHaveTextContent('zenflow install zf/agent/ledger-reconciler@2.4.1');
    fireEvent.click(screen.getByRole('button', { name: 'Copy install command' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('zenflow install zf/agent/ledger-reconciler@2.4.1'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Copied'));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('copies the registry id', async () => {
    const { writeText } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Copy registry id' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('zf/agent/ledger-reconciler'));
  });

  it('shows an error toast when the clipboard rejects', async () => {
    const { writeText } = setup();
    writeText.mockRejectedValueOnce(new Error('denied'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy install command' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('calls onClose on Escape', async () => {
    const { onClose, user } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the close button', async () => {
    const { onClose, user } = setup();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('links the publisher to its division site with the official mark', () => {
    setup();
    const link = screen.getByTestId('publisher-link');
    expect(link).toHaveAttribute('href', 'https://collective-ai-divisions-brown.vercel.app/quantum-ledger/');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveTextContent('Quantum Ledger');
    expect(link.querySelector('[data-mark="quantum-ledger"] svg')).not.toBeNull();
  });

  it('reveals the rent form from the primary action', async () => {
    const { user } = setup();
    expect(screen.queryByRole('form', { name: 'Rent Ledger Reconciler' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rent this agent' }));
    expect(screen.getByRole('form', { name: 'Rent Ledger Reconciler' })).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveValue('Interested in Ledger Reconciler (zf/agent/ledger-reconciler@2.4.1)');
    expect(screen.queryByRole('button', { name: 'Rent this agent' })).not.toBeInTheDocument();
  });

  it('labels the first rubric line as the decision log', () => {
    setup();
    expect(screen.getAllByTestId('rubric-row')[0]).toHaveTextContent(/decision log/i);
  });

  it('ranks similar listings by shared tags and integrations and opens one on click', async () => {
    const { onOpenProduct, user } = setup();
    const section = screen.getByRole('region', { name: 'Similar listings' });
    const buttons = within(section).getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('Invoice Chaser');
    expect(section).not.toHaveTextContent('Social Poster');
    await user.click(buttons[0]);
    expect(onOpenProduct).toHaveBeenCalledWith(invoiceChaser);
  });
});
