import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { DataScope, Product } from '@/types/marketplace';
import {
  CATEGORIES,
  PRICING_LABELS,
  SOURCE_LABELS,
  aegisBreakdown,
  aegisScore,
  formatPrice,
  registryId,
} from '@/lib/registry';
import AegisMeter from './AegisMeter';
import CoverArt from './CoverArt';
import RentForm from './RentForm';
import { Mark } from '@/components/brand/Mark';
import { ZfButton } from '@/components/brand/Button';
import { divisionUrl, publisherSlug } from '@/lib/network';

interface ListingSheetProps {
  product: Product | null;
  products: Product[];
  onClose: () => void;
  onOpenProduct: (p: Product) => void;
}

/** Same set the Aegis rubric penalises; shown with an outline so the buyer sees what costs points. */
const SENSITIVE: DataScope[] = ['pii', 'health', 'payments'];

/**
 * "2026-10-28" (or a full ISO timestamp) -> "Oct 28, 2026".
 * Parsed as UTC so the day never shifts with the viewer's timezone.
 */
export function formatDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** GitHub star counts: 950 -> "950", 12345 -> "12.3k", 123456 -> "123k", 1234567 -> "1.2M". */
export function formatStars(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n < 1000) return String(Math.round(n));
  const trim = (x: number, digits: number) => x.toFixed(digits).replace(/\.0$/, '');
  if (n < 100_000) return `${trim(Math.floor(n / 100) / 10, 1)}k`;
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`;
  return `${trim(Math.floor(n / 100_000) / 10, 1)}M`;
}

/** https link to a GitHub repo; falls back to the canonical URL when the stored one is not https GitHub. */
export function githubUrl(info: { repo: string; url: string }): string {
  return /^https:\/\/github\.com\//.test(info.url) ? info.url : `https://github.com/${info.repo}`;
}

const DIRECTORY_STATUS: Record<'available' | 'in-the-lab', string> = {
  available: 'Available',
  'in-the-lab': 'In the lab',
};

/** Up to `limit` other listings ranked by shared tags + integrations. Listings sharing nothing are left out. */
function similarListings(product: Product, products: Product[], limit = 3): Product[] {
  const tags = new Set(product.tags.map((t) => t.toLowerCase()));
  const integrations = new Set(product.integrations.map((i) => i.toLowerCase()));
  return products
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      shared:
        p.tags.filter((t) => tags.has(t.toLowerCase())).length +
        p.integrations.filter((i) => integrations.has(i.toLowerCase())).length,
    }))
    .filter((x) => x.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        (aegisScore(b.p) ?? -1) - (aegisScore(a.p) ?? -1) ||
        a.p.title.localeCompare(b.p.title),
    )
    .slice(0, limit)
    .map((x) => x.p);
}

async function copyText(text: string, what: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    toast.success('Copied');
    return true;
  } catch {
    toast.error(`Could not copy the ${what}. Select it and copy manually.`);
    return false;
  }
}

function Section({ title, description, id, children }: { title: string; description?: string; id?: string; children: ReactNode }) {
  const headingId = `listing-section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <section id={id} aria-labelledby={headingId} className="border-t border-zf-grid py-6">
      <h3 id={headingId} className="text-[15px] font-medium text-zf-text">
        {title}
      </h3>
      {description && <p className="mt-1 text-sm text-zf-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-[4px] bg-zf-raised px-2 py-1 text-sm text-zf-text', className)}>
      {children}
    </span>
  );
}

function PlainList({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return <p className="text-sm text-zf-muted">None declared.</p>;
  return (
    <ul aria-label={label} className="list-disc space-y-1.5 pl-5 text-sm text-zf-text marker:text-zf-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function ListingSheet({ product, products, onClose, onOpenProduct }: ListingSheetProps) {
  // Keep the last listing rendered while the sheet animates closed.
  const [shown, setShown] = useState<Product | null>(product);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [rentOpen, setRentOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) setShown(product);
    setCopiedInstall(false);
    setRentOpen(false);
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [product]);

  const p = product ?? shown;
  const open = product !== null;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-zf-canvas/70 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'duration-200 motion-reduce:animate-none',
          )}
        />
        {p && (
          <DialogPrimitive.Content
            className={cn(
              'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-zf-surface text-zf-text outline-none',
              'sm:max-w-[640px] sm:rounded-l-[12px] sm:border-l sm:border-zf-grid',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-200 data-[state=open]:ease-out',
              'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-150 data-[state=closed]:ease-in',
              'motion-reduce:animate-none',
            )}
          >
            <SheetBody
              product={p}
              products={products}
              onOpenProduct={onOpenProduct}
              scrollRef={scrollRef}
              copiedInstall={copiedInstall}
              setCopiedInstall={setCopiedInstall}
              rentOpen={rentOpen}
              setRentOpen={setRentOpen}
            />
          </DialogPrimitive.Content>
        )}
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SheetBody({
  product: p,
  products,
  onOpenProduct,
  scrollRef,
  copiedInstall,
  setCopiedInstall,
  rentOpen,
  setRentOpen,
}: {
  product: Product;
  products: Product[];
  onOpenProduct: (p: Product) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  copiedInstall: boolean;
  setCopiedInstall: (v: boolean) => void;
  rentOpen: boolean;
  setRentOpen: (v: boolean) => void;
}) {
  const rid = registryId(p);
  const oss = p.source === 'open-source' && p.openSource ? p.openSource : null;
  const dir = p.source === 'directory' && p.directory ? p.directory : null;
  const repoUrl = oss ? githubUrl(oss) : null;
  // Directory offers are bought on the division site: no install command.
  const installCmd = oss
    ? `git clone https://github.com/${oss.repo}.git`
    : dir
      ? null
      : `zenflow install ${rid}@${p.version}`;
  const rubric = aegisBreakdown(p);
  const score = aegisScore(p);
  const category = CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category;
  const similar = similarListings(p, products);
  const pubSlug = publisherSlug(p.publisher);
  const owner = oss ? oss.repo.split('/')[0] : null;
  // Open-source projects are never rented through Collective AI. Directory offers keep the
  // rent form only when ZenFlow itself publishes them (agent rentals and setups).
  const canRent = p.source === 'collective' || (p.source === 'directory' && p.publisher === 'ZenFlow');

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-zf-grid px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1">
          <code className="truncate font-mono text-sm text-zf-muted">{rid}</code>
          <button
            type="button"
            onClick={() => void copyText(rid, 'registry id')}
            aria-label="Copy registry id"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] text-zf-muted transition-colors duration-150 hover:bg-zf-raised hover:text-zf-text"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <DialogPrimitive.Close
          aria-label="Close"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] text-zf-muted transition-colors duration-150 hover:bg-zf-raised hover:text-zf-text"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </div>

      <div ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 sm:px-6">
        {/* Header */}
        <header className="pb-6 pt-5">
          <CoverArt product={p} variant="sheet" />
          <DialogPrimitive.Title className="mt-5 text-2xl font-medium leading-tight text-zf-text sm:text-[28px]">
            {p.title}
          </DialogPrimitive.Title>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-zf-muted">Version</dt>
              <dd className="font-mono text-zf-text">{p.version}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-zf-muted">Updated</dt>
              <dd className="text-zf-text">
                <time dateTime={p.updated}>{formatDate(p.updated)}</time>
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-zf-muted">Publisher</dt>
              <dd className="text-zf-text">
                {oss ? (
                  <span data-testid="publisher-open-source">Open source · maintained on GitHub by {owner}</span>
                ) : pubSlug ? (
                  <a
                    href={divisionUrl(pubSlug)}
                    rel="noopener"
                    data-testid="publisher-link"
                    className="inline-flex items-center gap-1.5 text-zf-blue-text underline-offset-2 transition-colors duration-150 hover:text-zf-text hover:underline"
                  >
                    <Mark division={pubSlug} size={18} title="" />
                    {p.publisher}
                  </a>
                ) : (
                  p.publisher
                )}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-zf-muted">Category</dt>
              <dd className="text-zf-text">{category}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-col gap-3">
            {oss && repoUrl && (
              <div>
                <ZfButton asChild>
                  <a href={repoUrl} rel="noopener" target="_blank">
                    View on GitHub
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </ZfButton>
              </div>
            )}
            {dir && (
              <div>
                <ZfButton asChild variant={canRent ? 'ghost' : 'primary'}>
                  <a href={dir.url} rel="noopener">
                    Open on the {p.publisher} site
                  </a>
                </ZfButton>
              </div>
            )}
            {canRent &&
              (rentOpen ? (
                <RentForm title={p.title} registryId={rid} version={p.version} />
              ) : (
                <div>
                  <ZfButton onClick={() => setRentOpen(true)}>Rent this agent</ZfButton>
                </div>
              ))}
          </div>
        </header>

        {/* Summary */}
        <section aria-label="Summary" className="border-t border-zf-grid py-6">
          <DialogPrimitive.Description className="text-base leading-relaxed text-zf-text">
            {p.summary}
          </DialogPrimitive.Description>
          <p className="mt-3 text-sm text-zf-muted">
            <span className="text-zf-text">Built for</span> {p.audience}
          </p>
          {!oss && (
            <p className="mt-1.5 text-sm text-zf-muted">
              <span className="text-zf-text">Running in</span> {p.deployedIn}
            </p>
          )}
        </section>

        {dir && (
          <Section title={`Offered on the ${p.publisher} site`}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-zf-muted">Page</dt>
              <dd className="min-w-0">
                <a
                  href={dir.url}
                  rel="noopener"
                  data-testid="directory-link"
                  className="break-all text-zf-blue-text underline-offset-2 hover:text-zf-text hover:underline"
                >
                  {dir.url.replace(/^https?:\/\//, '')}
                </a>
              </dd>
              <dt className="text-zf-muted">Status</dt>
              <dd className="text-zf-text" data-testid="directory-status">
                {DIRECTORY_STATUS[dir.status]}
              </dd>
            </dl>
          </Section>
        )}

        {oss && repoUrl && (
          <Section title="GitHub" description="Facts read from the GitHub API, not checked by Collective AI.">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-zf-muted">Repository</dt>
              <dd className="min-w-0">
                <a
                  href={repoUrl}
                  rel="noopener"
                  target="_blank"
                  data-testid="repo-link"
                  className="break-all font-mono text-zf-blue-text underline-offset-2 hover:text-zf-text hover:underline"
                >
                  {oss.repo}
                </a>
              </dd>
              <dt className="text-zf-muted">License</dt>
              <dd className="font-mono text-zf-text">{oss.license}</dd>
              <dt className="text-zf-muted">Stars</dt>
              <dd className="font-mono tabular-nums text-zf-text" data-testid="repo-stars">
                <span aria-hidden="true">★ </span>
                {formatStars(oss.stars)}
              </dd>
              <dt className="text-zf-muted">Language</dt>
              <dd className="text-zf-text">{oss.language}</dd>
              <dt className="text-zf-muted">Last push</dt>
              <dd className="text-zf-text">
                <time dateTime={oss.pushedAt}>{formatDate(oss.pushedAt)}</time>
              </dd>
            </dl>
            <p className="mt-3 text-xs text-zf-muted" data-testid="repo-checked">
              Checked <time dateTime={oss.checkedAt}>{formatDate(oss.checkedAt)}</time> from the GitHub API
            </p>
          </Section>
        )}

        <Section title="Capabilities">
          <PlainList items={p.capabilities} label="Capabilities" />
        </Section>

        <Section title="Inputs and outputs" description="What you hand it, and what it hands back.">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-sm text-zf-muted">Inputs</p>
              <PlainList items={p.inputs} label="Inputs" />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-sm text-zf-muted">Outputs</p>
              <PlainList items={p.outputs} label="Outputs" />
            </div>
          </div>
        </Section>

        <Section title="Integrations">
          {p.integrations.length ? (
            <ul aria-label="Integrations" className="flex flex-wrap gap-2">
              {p.integrations.map((i) => (
                <li key={i}>
                  <Chip>{i}</Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zf-muted">No third-party integrations.</p>
          )}
        </Section>

        <Section title="Data scopes" description="What this listing can read or write. Outlined scopes carry personal or regulated data.">
          {p.scopes.length ? (
            <ul aria-label="Data scopes" className="flex flex-wrap gap-2">
              {p.scopes.map((s) => {
                const sensitive = SENSITIVE.includes(s);
                return (
                  <li key={s}>
                    <Chip className={cn('font-mono', sensitive && 'border border-zf-text/50 bg-transparent')}>
                      {s}
                      {sensitive && <span className="font-sans text-xs text-zf-muted">sensitive</span>}
                    </Chip>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-zf-muted">Touches no customer data.</p>
          )}
        </Section>

        {score === null ? (
          <Section id="aegis-report" title="Aegis report">
            <p
              data-testid="aegis-not-assessed"
              className="rounded-[4px] border border-zf-grid bg-zf-canvas px-3 py-3 text-sm text-zf-text"
            >
              {oss
                ? 'Not assessed. Open-source project listed for reference; Collective AI does not run, vet or support it. Review the code and license before you run it.'
                : 'Not assessed. The publisher has not filed an Aegis declaration for this listing yet.'}
            </p>
          </Section>
        ) : (
          <Section
            id="aegis-report"
            title="Aegis report"
            description="Every point comes from a fact the publisher declared. Read it line by line."
          >
            <AegisMeter score={score} size="lg" />
            <table className="mt-5 w-full text-sm">
              <caption className="sr-only">Aegis score breakdown</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Criterion</th>
                  <th scope="col">Points</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {rubric.map((line) => (
                  <tr key={line.label} data-testid="rubric-row" className="border-b border-zf-grid/60 last:border-0">
                    <td className="py-2 pr-3 text-zf-text">{line.label}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right font-mono tabular-nums text-zf-muted">
                      <span className="text-zf-text">{line.points}</span>/{line.max}
                    </td>
                    <td className="w-16 py-2" aria-hidden="true">
                      <span className="relative block h-1 w-16 overflow-hidden rounded-[2px] bg-zf-grid">
                        <span
                          className="absolute inset-y-0 left-0 bg-zf-aegis"
                          style={{ width: `${line.max ? (line.points / line.max) * 100 : 0}%` }}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 font-medium text-zf-text">Total</td>
                  <td className="whitespace-nowrap pt-3 pr-3 text-right font-mono tabular-nums text-zf-aegis" data-testid="rubric-total">
                    {score}/100
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="min-w-0">
                <h4 className="mb-2 text-sm font-medium text-zf-text">Will not</h4>
                <PlainList items={p.aegis?.refusals ?? []} label="Will not" />
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 text-sm font-medium text-zf-text">Hands off to a human when</h4>
                <PlainList items={p.aegis?.escalations ?? []} label="Hands off to a human when" />
              </div>
            </div>
          </Section>
        )}

        <Section title="Pricing">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-lg text-zf-text">{formatPrice(p.pricing)}</span>
            <span className="text-sm text-zf-muted">{PRICING_LABELS[p.pricing.model]}</span>
          </p>
          <p className="mt-1.5 text-sm text-zf-muted">
            {oss
              ? `Free to use under its ${oss.license} license. Collective AI charges nothing and sells no support for it.`
              : dir
                ? `Priced and sold by ${p.publisher} on its division site.`
                : 'Pricing is provisional during internal validation.'}
          </p>
        </Section>

        <Section title="Changelog">
          {p.changelog.length === 0 && <p className="text-sm text-zf-muted">No changelog recorded.</p>}
          <ol aria-label="Changelog" className="space-y-3">
            {p.changelog.map((c) => (
              <li key={`${c.version}-${c.date}`} className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
                <span className="font-mono text-zf-text">{c.version}</span>
                <span className="min-w-0">
                  <time dateTime={c.date} className="text-zf-muted">
                    {formatDate(c.date)}
                  </time>
                  <span className="block text-zf-text">{c.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>

        {installCmd !== null && (
          <Section
            title="Install"
            description={oss ? 'Clone the source. Read it and its license before you run it.' : 'Run this in a Zenith OS workspace.'}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <code
                data-testid="install-command"
                className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-[4px] border border-zf-grid bg-zf-canvas px-3 py-3 font-mono text-sm text-zf-text"
              >
                {installCmd}
              </code>
              <ZfButton
                variant="ghost"
                onClick={async () => {
                  const ok = await copyText(installCmd, 'install command');
                  setCopiedInstall(ok);
                }}
                className="text-sm"
              >
                {copiedInstall ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copiedInstall ? 'Copied' : oss ? 'Copy clone command' : 'Copy install command'}
              </ZfButton>
            </div>
          </Section>
        )}

        {similar.length > 0 && (
          <Section title="Similar listings" description="Ranked by shared tags and integrations.">
            <ul className="divide-y divide-zf-grid rounded-[4px] border border-zf-grid">
              {similar.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProduct(s)}
                    className="flex min-h-11 w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-zf-raised"
                  >
                    <span className="text-sm font-medium text-zf-text">{s.title}</span>
                    <span className="max-w-full truncate text-xs text-zf-muted">
                      <span className="font-mono">{s.openSource ? s.openSource.repo : registryId(s)}</span>
                      {' · '}
                      {SOURCE_LABELS[s.source]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </>
  );
}
