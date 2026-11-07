import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RentForm, { RENT_SERVICE, validateLead } from './RentForm';
import { LEAD_ENDPOINT } from '@/lib/network';

const START = 'https://collective-ai-divisions-brown.vercel.app/zenflow/start.html';

function setup() {
  const user = userEvent.setup();
  const { container } = render(<RentForm title="Ledger Reconciler" registryId="zf/agent/ledger-reconciler" version="2.4.1" />);
  return { user, container };
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText(/Business/), 'Analytical Engines');
}

function mockFetch(impl: () => Promise<unknown>) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('RentForm', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('prefills the message with the listing and version', () => {
    setup();
    expect(screen.getByLabelText('Message')).toHaveValue('Interested in Ledger Reconciler (zf/agent/ledger-reconciler@2.4.1)');
  });

  it('includes the hidden company_site honeypot, out of the tab order', () => {
    const { container } = setup();
    const hp = container.querySelector('input[name="company_site"]') as HTMLInputElement;
    expect(hp).not.toBeNull();
    expect(hp.tabIndex).toBe(-1);
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('validates required fields inline without calling fetch', async () => {
    const fetchFn = mockFetch(() => Promise.resolve(new Response('{}')));
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Send to ZenFlow' }));
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveFocus();

    await user.type(screen.getByLabelText('Name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Send to ZenFlow' }));
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByText(/valid email/)).toBeInTheDocument();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('validateLead mirrors api/lead.js rules', () => {
    expect(validateLead('', 'a@b.co')).toHaveProperty('name');
    expect(validateLead('A', 'a@b')).toHaveProperty('email');
    expect(validateLead('A', 'a@b.co')).toEqual({});
  });

  it('posts the lead as JSON and shows the success state', async () => {
    let resolve: (r: Response) => void = () => {};
    const fetchFn = mockFetch(() => new Promise<Response>((r) => (resolve = r)));
    const { user } = setup();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Send to ZenFlow' }));

    const busy = screen.getByRole('button', { name: 'Sending…' });
    expect(busy).toBeDisabled();

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(LEAD_ENDPOINT);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      business: 'Analytical Engines',
      message: 'Interested in Ledger Reconciler (zf/agent/ledger-reconciler@2.4.1)',
      division: 'ZenFlow',
      service: RENT_SERVICE,
      source: 'marketplace',
      company_site: '',
    });

    resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    expect(await screen.findByRole('status')).toHaveTextContent('Sent. ZenFlow replies within one business day.');
  });

  it('shows the server error from a 400 JSON response, with the start page fallback', async () => {
    mockFetch(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'Name and a valid email are required' }), { status: 400 })),
    );
    const { user } = setup();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Send to ZenFlow' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Name and a valid email are required');
    expect(screen.getByRole('link', { name: 'Use the ZenFlow start page instead' })).toHaveAttribute('href', START);
    // The form stays usable for a retry.
    expect(screen.getByRole('button', { name: 'Send to ZenFlow' })).toBeEnabled();
  });

  it('handles a network or CORS failure with a fallback link', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    const { user } = setup();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Send to ZenFlow' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We could not reach ZenFlow from here.');
    expect(alert).toHaveTextContent('Your message was not sent.');
    const link = screen.getByRole('link', { name: 'Use the ZenFlow start page instead' });
    expect(link).toHaveAttribute('href', START);
    expect(link).toHaveAttribute('rel', 'noopener');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send to ZenFlow' })).toBeEnabled());
  });

  it('falls back to a status message when the error body is not JSON', async () => {
    mockFetch(() => Promise.resolve(new Response('Bad gateway', { status: 502 })));
    const { user } = setup();
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Send to ZenFlow' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The request failed (502).');
  });
});
