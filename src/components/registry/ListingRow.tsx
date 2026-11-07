import type { DataScope, Product } from '@/types/marketplace';
import { SOURCE_LABELS, aegisScore, formatPrice, registryId } from '@/lib/registry';
import { cn } from '@/lib/utils';
import AegisMeter from './AegisMeter';

export const SCOPE_LABELS: Record<DataScope, string> = {
  email: 'Email',
  calendar: 'Calendar',
  crm: 'CRM',
  files: 'Files',
  payments: 'Payments',
  pii: 'PII',
  health: 'Health',
  code: 'Code',
  'public-web': 'Public web',
  chat: 'Chat',
};

/** Regulated or personal data. Mirrors the Aegis rubric in lib/registry. */
export const SENSITIVE_SCOPES: DataScope[] = ['pii', 'health', 'payments'];

export function isSensitive(scope: DataScope): boolean {
  return SENSITIVE_SCOPES.includes(scope);
}

const MAX_SCOPES = 4;

export function ScopeChips({ scopes, className }: { scopes: DataScope[]; className?: string }) {
  if (scopes.length === 0) {
    return <span className={cn('text-xs text-zf-muted', className)}>No data scopes</span>;
  }
  // Sensitive scopes first so they are never the ones hidden behind "+n".
  const ordered = [...scopes].sort((a, b) => Number(isSensitive(b)) - Number(isSensitive(a)));
  const shown = ordered.slice(0, MAX_SCOPES);
  const hidden = ordered.length - shown.length;
  const sensitiveCount = scopes.filter(isSensitive).length;
  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      <span className="sr-only">Data scopes: </span>
      {shown.map((s) => (
        <span
          key={s}
          className={cn(
            'inline-flex items-center rounded-[4px] border px-1.5 py-px text-[11px] leading-4',
            isSensitive(s) ? 'border-zf-text/50 text-zf-text' : 'border-zf-grid text-zf-muted',
          )}
        >
          {SCOPE_LABELS[s]}
          {isSensitive(s) && <span className="sr-only"> (sensitive)</span>}
        </span>
      ))}
      {hidden > 0 && (
        <span className="text-[11px] text-zf-muted" title={ordered.slice(MAX_SCOPES).map((s) => SCOPE_LABELS[s]).join(', ')}>
          +{hidden}
        </span>
      )}
      {sensitiveCount > 0 && (
        <span className="text-[11px] text-zf-muted" aria-hidden="true">
          {sensitiveCount} sensitive
        </span>
      )}
    </span>
  );
}

/**
 * "Open source" or "Division service". Division-run (collective) listings are the
 * default and carry no badge.
 */
export function SourceBadge({ product, className }: { product: Pick<Product, 'source'>; className?: string }) {
  if (product.source === 'collective') return null;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border border-zf-grid px-1.5 py-px text-[11px] leading-4 text-zf-muted',
        className,
      )}
    >
      {SOURCE_LABELS[product.source]}
    </span>
  );
}

/** Who published it. Open-source listings name the GitHub owner/repo, not a division. */
export function PublisherLine({ product, className }: { product: Product; className?: string }) {
  const name = product.source === 'open-source' ? product.openSource?.repo : product.publisher;
  return (
    <p className={cn('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zf-muted', className)}>
      {name && (
        <span className="min-w-0 truncate">
          <span className="sr-only">Publisher: </span>
          {name}
        </span>
      )}
      <SourceBadge product={product} />
    </p>
  );
}

/** Aegis meter, or a muted "Not assessed" when the listing has no declaration (open source). */
export function AegisCell({ product, className }: { product: Product; className?: string }) {
  const score = aegisScore(product);
  if (score === null) {
    return (
      <span className={cn('flex items-center text-xs text-zf-muted', className)} title="Not assessed by Aegis">
        Not assessed
      </span>
    );
  }
  return <AegisMeter score={score} className={className} />;
}

interface ListingRowProps {
  product: Product;
  onOpen: (p: Product) => void;
}

/**
 * One registry listing. A stacked card below lg, a dense table-like row at lg+.
 * Single DOM tree so tests and assistive tech see one entry per listing.
 * The title button is the only interactive element; its ::after stretches over
 * the whole entry so the full row is clickable.
 */
export default function ListingRow({ product, onOpen }: ListingRowProps) {
  const id = registryId(product);
  return (
    <li
      className={cn(
        'relative rounded-lg border border-zf-grid bg-zf-surface p-4 transition-colors duration-150 hover:bg-zf-raised',
        'lg:grid lg:grid-cols-[minmax(0,1fr)_176px_104px_88px] lg:items-center lg:gap-4 lg:rounded-[4px] lg:border-0 lg:bg-transparent lg:px-3 lg:py-3',
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-xs text-zf-muted">{id}</p>
        <h3 className="mt-1 text-base font-medium leading-snug text-zf-text lg:text-[15px]">
          <button
            type="button"
            onClick={() => onOpen(product)}
            className={cn(
              'text-left focus-visible:outline-none',
              "after:absolute after:inset-0 after:rounded-[inherit] after:content-['']",
              'focus-visible:after:ring-2 focus-visible:after:ring-zf-blue',
            )}
          >
            {product.title}
          </button>
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-zf-muted lg:line-clamp-none lg:truncate">{product.summary}</p>
        <PublisherLine product={product} className="mt-1" />
      </div>

      <ScopeChips scopes={product.scopes} className="mt-3 lg:mt-0" />

      <div className="mt-3 flex items-center justify-between gap-4 lg:contents">
        <p className="font-mono text-[13px] text-zf-text lg:text-right">
          <span className="sr-only">Price: </span>
          {formatPrice(product.pricing)}
        </p>
        <AegisCell product={product} className="lg:justify-end" />
      </div>
    </li>
  );
}
