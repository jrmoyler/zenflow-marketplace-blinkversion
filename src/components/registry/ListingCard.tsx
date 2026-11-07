import type { Product } from '@/types/marketplace';
import { formatPrice, registryId } from '@/lib/registry';
import { cn } from '@/lib/utils';
import CoverArt from './CoverArt';
import { AegisCell, PublisherLine, ScopeChips } from './ListingRow';

interface ListingCardProps {
  product: Product;
  onOpen: (p: Product) => void;
}

/**
 * Grid card for one listing: cover art, then the facts a buyer scans first.
 * The title button is the only interactive element; its ::after stretches over
 * the whole card so the full card opens the listing (same pattern as ListingRow).
 */
export default function ListingCard({ product, onOpen }: ListingCardProps) {
  return (
    <li
      className={cn(
        'group relative flex flex-col rounded-lg border border-zf-grid bg-zf-surface',
        'transition-colors duration-150 hover:border-zf-muted/40',
      )}
      data-listing={product.id}
    >
      <CoverArt
        product={product}
        className="rounded-t-[7px] border-b border-zf-grid opacity-[0.84] transition-opacity duration-150 group-hover:opacity-100"
      />
      <div className="flex flex-1 flex-col p-4">
        <p className="truncate font-mono text-xs text-zf-muted">{registryId(product)}</p>
        <h3 className="mt-1 text-base font-medium leading-snug text-zf-text">
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
        <p className="mt-1 line-clamp-2 text-[13px] text-zf-muted">{product.summary}</p>
        <PublisherLine product={product} className="mt-2" />
        <ScopeChips scopes={product.scopes} className="mt-3" />
        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <p className="font-mono text-[13px] text-zf-text">
            <span className="sr-only">Price: </span>
            {formatPrice(product.pricing)}
          </p>
          <AegisCell product={product} />
        </div>
      </div>
    </li>
  );
}
