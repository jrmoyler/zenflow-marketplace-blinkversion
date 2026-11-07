import { useId, useMemo } from 'react';
import type { DataScope, FilterState, PricingModel, Product, Publisher } from '@/types/marketplace';
import { CATEGORIES, PRICING_LABELS, allPublishers, categoryCounts, filterProducts } from '@/lib/registry';
import { cn } from '@/lib/utils';
import { SCOPE_LABELS, isSensitive } from './ListingRow';

export interface FacetsProps {
  products: Product[];
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
}

export const AEGIS_STEPS = [0, 50, 70, 85] as const;

const PRICING_ORDER: PricingModel[] = ['free', 'monthly', 'usage', 'one-time'];
const SCOPE_ORDER = Object.keys(SCOPE_LABELS) as DataScope[];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({ legend, hint, children }: { legend: string; hint?: string; children: React.ReactNode }) {
  const hintId = useId();
  return (
    <fieldset className="border-t border-zf-grid pt-4 first:border-t-0 first:pt-0" aria-describedby={hint ? hintId : undefined}>
      <legend className="float-left mb-2 w-full text-[13px] font-medium text-zf-text">{legend}</legend>
      {hint && (
        <p id={hintId} className="clear-left mb-2 text-xs text-zf-muted">
          {hint}
        </p>
      )}
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
  muted,
}: {
  label: React.ReactNode;
  count: number;
  checked: boolean;
  onChange: () => void;
  muted?: boolean;
}) {
  const disabled = count === 0 && !checked;
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[4px] px-1.5 text-[13px] transition-colors duration-150 hover:bg-zf-raised lg:min-h-8',
        disabled && 'cursor-default text-zf-muted/60 hover:bg-transparent',
        !disabled && (muted ? 'text-zf-muted' : 'text-zf-text'),
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 shrink-0 rounded-[3px] border-zf-grid accent-[hsl(var(--zf-violet))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zf-blue"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="font-mono text-xs tabular-nums text-zf-muted">{count}</span>
    </label>
  );
}

export default function Facets({ products, filters, onFiltersChange }: FacetsProps) {
  const set = (patch: Partial<FilterState>) => onFiltersChange({ ...filters, ...patch });

  const catCounts = useMemo(() => categoryCounts(products, filters), [products, filters]);

  // Each facet counts against every other active filter, but not its own selection.
  const pricingCounts = useMemo(() => {
    const base = filterProducts(products, { ...filters, pricingModels: [] });
    return Object.fromEntries(PRICING_ORDER.map((m) => [m, base.filter((p) => p.pricing.model === m).length])) as Record<
      PricingModel,
      number
    >;
  }, [products, filters]);

  const publishers = useMemo(() => {
    const list = allPublishers(products);
    for (const p of filters.publishers) if (!list.includes(p)) list.push(p);
    return list;
  }, [products, filters.publishers]);

  const publisherCounts = useMemo(() => {
    const base = filterProducts(products, { ...filters, publishers: [] });
    const counts = {} as Record<Publisher, number>;
    for (const p of base) counts[p.publisher] = (counts[p.publisher] ?? 0) + 1;
    return counts;
  }, [products, filters]);

  const scopes = useMemo(
    () => SCOPE_ORDER.filter((s) => filters.excludeScopes.includes(s) || products.some((p) => p.scopes.includes(s))),
    [products, filters.excludeScopes],
  );

  /** How many currently-visible listings a scope exclusion would hide (or is hiding). */
  const scopeCounts = useMemo(() => {
    const counts = {} as Record<DataScope, number>;
    for (const s of scopes) {
      const base = filterProducts(products, { ...filters, excludeScopes: filters.excludeScopes.filter((x) => x !== s) });
      counts[s] = base.filter((p) => p.scopes.includes(s)).length;
    }
    return counts;
  }, [products, filters, scopes]);

  return (
    <div className="space-y-4">
      <Group legend="Category">
        {CATEGORIES.map((c) => (
          <CheckRow
            key={c.id}
            label={c.label}
            count={catCounts[c.id]}
            checked={filters.categories.includes(c.id)}
            onChange={() => set({ categories: toggle(filters.categories, c.id) })}
          />
        ))}
      </Group>

      <Group legend="Pricing model">
        {PRICING_ORDER.map((m) => (
          <CheckRow
            key={m}
            label={PRICING_LABELS[m]}
            count={pricingCounts[m]}
            checked={filters.pricingModels.includes(m)}
            onChange={() => set({ pricingModels: toggle(filters.pricingModels, m) })}
          />
        ))}
      </Group>

      <Group legend="Exclude data scopes" hint="Hide listings that touch any checked scope. Counts show how many each would hide.">
        {scopes.length === 0 && <p className="text-xs text-zf-muted">No scopes declared.</p>}
        {scopes.map((s) => (
          <CheckRow
            key={s}
            label={
              <>
                {SCOPE_LABELS[s]}
                {isSensitive(s) && <span className="ml-1.5 text-[11px] text-zf-muted">sensitive</span>}
              </>
            }
            count={scopeCounts[s] ?? 0}
            checked={filters.excludeScopes.includes(s)}
            onChange={() => set({ excludeScopes: toggle(filters.excludeScopes, s) })}
          />
        ))}
      </Group>

      <Group legend="Publisher">
        {publishers.map((p) => (
          <CheckRow
            key={p}
            label={p}
            count={publisherCounts[p] ?? 0}
            checked={filters.publishers.includes(p)}
            onChange={() => set({ publishers: toggle(filters.publishers, p) })}
          />
        ))}
      </Group>

      <Group legend="Minimum Aegis score">
        <div className="grid grid-cols-4 overflow-hidden rounded-[4px] border border-zf-grid">
          {AEGIS_STEPS.map((step, i) => {
            const active = filters.minAegis === step;
            return (
              <button
                key={step}
                type="button"
                aria-pressed={active}
                onClick={() => set({ minAegis: step })}
                className={cn(
                  'min-h-11 text-[13px] transition-colors duration-150 focus-visible:relative focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zf-blue lg:min-h-8',
                  i > 0 && 'border-l border-zf-grid',
                  active ? 'bg-zf-raised text-zf-aegis' : 'text-zf-muted hover:bg-zf-raised hover:text-zf-text',
                )}
              >
                {step === 0 ? 'Any' : <span className="font-mono">{step}+</span>}
              </button>
            );
          })}
        </div>
      </Group>
    </div>
  );
}
