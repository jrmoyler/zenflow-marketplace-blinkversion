import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import ListingSheet, { formatStars } from './ListingSheet';
import { aegisScore } from '@/lib/registry';
import type { Product } from '@/types/marketplace';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

function make(overrides: Partial<Product> & Pick<Product, 'id' | 'title'>): Product {
  return {
    summary: `${overrides.title} does one job.`,
    audience: 'Operators.',
    category: 'agents',
    source: 'collective',
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
const ledgerKit = make({
  id: 'ledger-kit',
  title: 'Ledger Kit',
  summary: 'Open-source scripts that reconcile bank exports.',
  source: 'open-source',
  publisher: 'Open source',
  deployedIn: 'Not run by Collective AI',
  aegis: null,
  integrations: ['Xero'],
  tags: ['finance', 'accounting'],
  changelog: [],
  openSource: {
    repo: 'acme/ledger-kit',
    url: 'https://github.com/acme/ledger-kit',
    license: 'Apache-2.0',
    stars: 12345,
    language: 'Python',
    pushedAt: '2026-10-30T08:15:00Z',
    checkedAt: '2026-11-07',
  },
});
const brandAudit = make({
  id: 'brand-audit',
  title: 'Brand Audit',
  source: 'directory',
  publisher: 'Nexus Labs',
  pricing: { model: 'quote', amount: 0 },
  tags: ['finance'],
  directory: { url: 'https://collective-ai-divisions-brown.vercel.app/nexus-labs/services.html', status: 'in-the-lab' },
});
const agentSetup = make({
  id: 'agent-setup',
  title: 'Agent Setup',
  source: 'directory',
  publisher: 'ZenFlow',
  pricing: { model: 'quote', amount: 0 },
  directory: { url: 'https://collective-ai-divisions-brown.vercel.app/zenflow/start.html', status: 'available' },
});
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
    expect(within(refusals).getAllByRole('listitem').map((li) => li.textContent)).toEqual(ledger.aegis!.refusals);
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

describe('formatStars', () => {
  it('abbreviates GitHub star counts', () => {
    expect(formatStars(950)).toBe('950');
    expect(formatStars(1000)).toBe('1k');
    expect(formatStars(12345)).toBe('12.3k');
    expect(formatStars(123456)).toBe('123k');
    expect(formatStars(1_234_567)).toBe('1.2M');
  });
});

describe('ListingSheet for an open-source project', () => {
  beforeEach(() => vi.clearAllMocks());

  function renderOss() {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const onOpenProduct = vi.fn();
    render(
      <ListingSheet product={ledgerKit} products={[...products, ledgerKit]} onClose={vi.fn()} onOpenProduct={onOpenProduct} />,
    );
    return { writeText, dialog: screen.getByRole('dialog', { name: 'Ledger Kit' }) };
  }

  it('never shows an Aegis number and says it is not assessed', () => {
    renderOss();
    const report = document.getElementById('aegis-report')!;
    expect(within(report).queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('rubric-row')).toHaveLength(0);
    expect(screen.getByTestId('aegis-not-assessed')).toHaveTextContent(
      'Not assessed. Open-source project listed for reference; Collective AI does not run, vet or support it. Review the code and license before you run it.',
    );
    expect(screen.getByTestId('aegis-not-assessed').className).not.toMatch(/aegis/);
  });

  it('shows GitHub facts with the date they were checked', () => {
    renderOss();
    const section = screen.getByRole('region', { name: 'GitHub' });
    const repo = within(section).getByTestId('repo-link');
    expect(repo).toHaveAttribute('href', 'https://github.com/acme/ledger-kit');
    expect(repo).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(repo).toHaveTextContent('acme/ledger-kit');
    expect(section).toHaveTextContent('Apache-2.0');
    expect(within(section).getByTestId('repo-stars')).toHaveTextContent('★ 12.3k');
    expect(section).toHaveTextContent('Python');
    expect(section).toHaveTextContent('Oct 30, 2026');
    expect(within(section).getByTestId('repo-checked')).toHaveTextContent('Checked Nov 7, 2026 from the GitHub API');
  });

  it('names the GitHub owner as maintainer, offers View on GitHub and no rent form', () => {
    const { dialog } = renderOss();
    expect(screen.getByTestId('publisher-open-source')).toHaveTextContent('Open source · maintained on GitHub by acme');
    expect(screen.queryByTestId('publisher-link')).not.toBeInTheDocument();
    const gh = within(dialog).getByRole('link', { name: /View on GitHub/ });
    expect(gh).toHaveAttribute('href', 'https://github.com/acme/ledger-kit');
    expect(gh).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(within(dialog).queryByRole('button', { name: 'Rent this agent' })).not.toBeInTheDocument();
    expect(dialog).not.toHaveTextContent('Running in');
  });

  it('installs with git clone and copies it', async () => {
    const { writeText } = renderOss();
    expect(screen.getByTestId('install-command')).toHaveTextContent('git clone https://github.com/acme/ledger-kit.git');
    fireEvent.click(screen.getByRole('button', { name: 'Copy clone command' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('git clone https://github.com/acme/ledger-kit.git'));
  });

  it('finds similar listings across sources', () => {
    renderOss();
    const section = screen.getByRole('region', { name: 'Similar listings' });
    expect(section).toHaveTextContent('Ledger Reconciler');
    expect(section).toHaveTextContent('Invoice Chaser');
  });
});

describe('ListingSheet for a division service', () => {
  it('links to the division site with its status, and has no install command', () => {
    render(<ListingSheet product={brandAudit} products={[brandAudit, ledger]} onClose={vi.fn()} onOpenProduct={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Brand Audit' });
    const section = screen.getByRole('region', { name: 'Offered on the Nexus Labs site' });
    expect(within(section).getByTestId('directory-link')).toHaveAttribute('href', brandAudit.directory!.url);
    expect(within(section).getByTestId('directory-status')).toHaveTextContent('In the lab');
    const action = within(dialog).getByRole('link', { name: 'Open on the Nexus Labs site' });
    expect(action).toHaveAttribute('href', brandAudit.directory!.url);
    expect(screen.queryByTestId('install-command')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Rent this agent' })).not.toBeInTheDocument();
    expect(within(dialog).getByText('Quoted', { selector: '.font-mono' })).toBeInTheDocument();
    // Directory offers declared by a division keep their Aegis report.
    expect(within(document.getElementById('aegis-report')!).getByRole('meter')).toBeInTheDocument();
  });

  it('marks an unassessed division service as not assessed, without the open-source wording', () => {
    const unassessed = { ...brandAudit, aegis: null };
    render(<ListingSheet product={unassessed} products={[unassessed]} onClose={vi.fn()} onOpenProduct={vi.fn()} />);
    const notice = screen.getByTestId('aegis-not-assessed');
    expect(notice).toHaveTextContent(/^Not assessed\./);
    expect(notice).not.toHaveTextContent(/open-source/i);
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('keeps the rent form for ZenFlow-published offers', () => {
    render(<ListingSheet product={agentSetup} products={[agentSetup]} onClose={vi.fn()} onOpenProduct={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Agent Setup' });
    expect(within(dialog).getByRole('link', { name: 'Open on the ZenFlow site' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Rent this agent' })).toBeInTheDocument();
    expect(within(dialog).getByTestId('directory-status')).toHaveTextContent('Available');
  });
});
