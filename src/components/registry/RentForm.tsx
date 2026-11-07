import { useId, useRef, useState, type FormEvent } from 'react';
import { ZfButton } from '@/components/brand/Button';
import { LEAD_ENDPOINT, divisionUrl } from '@/lib/network';
import { cn } from '@/lib/utils';

/** ZenFlow's live offer this form converts to (build/divisions/zenflow.js formServices). */
export const RENT_SERVICE = 'Rent an agent (monthly)';

export interface RentFormProps {
  title: string;
  registryId: string;
  version: string;
  /** Override for tests; defaults to the shared lead handler. */
  endpoint?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Errors = Partial<Record<'name' | 'email', string>>;

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function validateLead(name: string, email: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = 'Enter your name.';
  if (!email.trim()) errors.email = 'Enter your email.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email, like you@company.com.';
  return errors;
}

const input =
  'mt-1.5 block h-11 w-full rounded-[4px] border border-zf-grid bg-zf-canvas px-3 text-sm text-zf-text placeholder:text-zf-muted/70 ' +
  'transition-[border-color] duration-150 hover:border-zf-muted/40 focus:border-zf-blue aria-[invalid=true]:border-red-400';

export default function RentForm({ title, registryId, version, endpoint = LEAD_ENDPOINT }: RentFormProps) {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [business, setBusiness] = useState('');
  const [message, setMessage] = useState(`Interested in ${title} (${registryId}@${version})`);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const startUrl = divisionUrl('zenflow', 'start.html');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    const found = validateLead(name, email);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (found.email) return emailRef.current?.focus();

    setStatus('submitting');
    setServerError('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          business: business.trim(),
          message: message.trim(),
          division: 'ZenFlow',
          service: RENT_SERVICE,
          source: 'marketplace',
          company_site: honeypot,
        }),
      });
      if (!res.ok) {
        let msg = '';
        try {
          const data = await res.json();
          if (data && typeof data.error === 'string') msg = data.error;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(msg || `The request failed (${res.status}).`);
      }
      setStatus('success');
    } catch (err) {
      // fetch rejects with a TypeError on network or CORS failure.
      const msg = err instanceof TypeError ? 'We could not reach ZenFlow from here.' : (err as Error).message;
      setServerError(msg);
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div role="status" className="rounded-[4px] border border-zf-grid bg-zf-canvas px-4 py-4 text-sm text-zf-text">
        Sent. ZenFlow replies within one business day.
      </div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={`Rent ${title}`}
      className="space-y-4 rounded-[4px] border border-zf-grid bg-zf-canvas/60 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className="text-sm text-zf-text">
            Name
          </label>
          <input
            ref={nameRef}
            id={id('name')}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? id('name-err') : undefined}
            className={input}
          />
          {errors.name && (
            <p id={id('name-err')} className="mt-1 text-sm text-red-300">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={id('email')} className="text-sm text-zf-text">
            Email
          </label>
          <input
            ref={emailRef}
            id={id('email')}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? id('email-err') : undefined}
            className={input}
          />
          {errors.email && (
            <p id={id('email-err')} className="mt-1 text-sm text-red-300">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor={id('business')} className="text-sm text-zf-text">
          Business <span className="text-zf-muted">(optional)</span>
        </label>
        <input
          id={id('business')}
          name="business"
          autoComplete="organization"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor={id('message')} className="text-sm text-zf-text">
          Message
        </label>
        <textarea
          id={id('message')}
          name="message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(input, 'h-auto py-2.5 leading-relaxed')}
        />
      </div>
      {/* Honeypot: hidden from people and assistive tech; bots fill it and api/lead.js drops the lead. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor={id('company_site')}>Company site</label>
        <input
          id={id('company_site')}
          name="company_site"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {status === 'error' && (
        <div role="alert" className="rounded-[4px] border border-red-400/40 bg-red-500/5 px-3 py-3 text-sm text-zf-text">
          <p>{serverError} Your message was not sent.</p>
          <a
            href={startUrl}
            rel="noopener"
            className="mt-1 inline-flex min-h-[44px] items-center text-zf-blue-text underline underline-offset-2 hover:text-zf-text"
          >
            Use the ZenFlow start page instead
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <ZfButton type="submit" disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? 'Sending…' : 'Send to ZenFlow'}
        </ZfButton>
        <p className="text-xs text-zf-muted">{RENT_SERVICE}. No payment is taken here.</p>
      </div>
    </form>
  );
}
