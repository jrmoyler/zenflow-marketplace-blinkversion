import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskFinder from './TaskFinder';
import type { Product } from '@/types/marketplace';

function make(overrides: Partial<Product> & Pick<Product, 'id' | 'title'>): Product {
  return {
    summary: `${overrides.title}.`,
    audience: 'Operators.',
    category: 'agents',
    publisher: 'ZenFlow Labs',
    deployedIn: 'ZenFlow Labs ops',
    capabilities: [],
    inputs: [],
    outputs: [],
    integrations: [],
    scopes: [],
    pricing: { model: 'free', amount: 0 },
    aegis: { refusals: ['Never deletes data'], escalations: [], auditLog: true, humanInLoop: false, inspectable: false },
    version: '1.0.0',
    updated: '2026-01-01',
    changelog: [],
    tags: [],
    ...overrides,
  };
}

const reconciler = make({
  id: 'payout-reconciler',
  title: 'Payout Reconciler',
  summary: 'Reconciles Stripe payouts against open invoices.',
  capabilities: ['Match payouts to invoices'],
  integrations: ['Stripe'],
  tags: ['finance', 'reconciliation'],
});
const invoicer = make({
  id: 'invoice-drafter',
  title: 'Invoice Drafter',
  summary: 'Drafts invoices from signed quotes.',
  tags: ['finance', 'invoices'],
});
const support = make({
  id: 'support-triage',
  title: 'Support Triage',
  summary: 'Sorts inbound support email by urgency.',
  category: 'bots',
  tags: ['support', 'email'],
});
const products = [support, invoicer, reconciler];

function setup() {
  const onClose = vi.fn();
  const onOpenProduct = vi.fn();
  const user = userEvent.setup();
  render(<TaskFinder open products={products} onClose={onClose} onOpenProduct={onOpenProduct} />);
  return { onClose, onOpenProduct, user };
}

describe('TaskFinder', () => {
  it('renders the dialog with title, textarea and honest footnote', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Find by task' })).toBeInTheDocument();
    expect(screen.getByLabelText('Describe the job')).toHaveAttribute(
      'placeholder',
      'Describe the job, e.g. reconcile Stripe payouts against invoices every Friday',
    );
    expect(
      screen.getByText('Keyword match over listing capabilities and tags. No model call, nothing leaves your browser.'),
    ).toBeInTheDocument();
  });

  it('ranks results as you type and shows matched terms', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Describe the job'), 'reconcile stripe payouts against invoices');
    const list = await screen.findByRole('list', { name: 'Matching listings' });
    const items = within(list).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Payout Reconciler');
    expect(items[0]).toHaveTextContent('zf/agent/payout-reconciler');
    expect(items[0]).toHaveTextContent(/Matched: .*stripe/);
    expect(items[0]).toHaveTextContent(/payouts/);
    expect(within(items[0]).getByRole('meter')).toBeInTheDocument();
    expect(list).not.toHaveTextContent('Support Triage');
  });

  it('fills the textarea from an example brief', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Reconcile Stripe payouts against invoices every Friday' }));
    expect(screen.getByLabelText('Describe the job')).toHaveValue('Reconcile Stripe payouts against invoices every Friday');
    expect(await screen.findByRole('list', { name: 'Matching listings' })).toHaveTextContent('Payout Reconciler');
  });

  it('shows a no-match state that routes to the registry', async () => {
    const { user, onClose } = setup();
    await user.type(screen.getByLabelText('Describe the job'), 'translate podcasts into klingon');
    expect(await screen.findByText('No listing matches those words.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Matching listings' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Search the registry' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('opens a result and closes the finder', async () => {
    const { user, onClose, onOpenProduct } = setup();
    await user.type(screen.getByLabelText('Describe the job'), 'support email');
    const list = await screen.findByRole('list', { name: 'Matching listings' });
    await user.click(within(list).getByRole('button', { name: /Support Triage/ }));
    expect(onClose).toHaveBeenCalled();
    expect(onOpenProduct).toHaveBeenCalledWith(support);
  });

  it('calls onClose on Escape', async () => {
    const { user, onClose } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows no results before anything is typed', async () => {
    setup();
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Matching listings' })).not.toBeInTheDocument());
    expect(screen.queryByText('No listing matches those words.')).not.toBeInTheDocument();
  });
});
