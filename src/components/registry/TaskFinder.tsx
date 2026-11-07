import { useEffect, useMemo, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/marketplace';
import { aegisScore, matchTask, registryId } from '@/lib/registry';
import AegisMeter from './AegisMeter';

interface TaskFinderProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onOpenProduct: (p: Product) => void;
}

const EXAMPLES = [
  'Reconcile Stripe payouts against invoices every Friday',
  'Triage inbound support email and draft replies for review',
  'Check vendor contracts for missing clauses before signing',
  'Summarize sales calls into CRM notes',
];

const DEBOUNCE_MS = 150;

export default function TaskFinder({ open, onClose, products, onOpenProduct }: TaskFinderProps) {
  const [brief, setBrief] = useState('');
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const goToRegistry = useRef(false);

  // Debounce matching while typing. Matching is synchronous and local; the delay only avoids re-ranking per keystroke.
  useEffect(() => {
    if (brief === query) return;
    const t = window.setTimeout(() => setQuery(brief), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [brief, query]);

  const results = useMemo(() => matchTask(products, query), [products, query]);
  const hasQuery = query.trim().length > 0;

  const fillExample = (text: string) => {
    setBrief(text);
    setQuery(text);
    textareaRef.current?.focus();
  };

  const openResult = (p: Product) => {
    onClose();
    onOpenProduct(p);
  };

  const browseRegistry = () => {
    goToRegistry.current = true;
    onClose();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-zf-canvas/70 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'duration-150 motion-reduce:animate-none',
          )}
        />
        <DialogPrimitive.Content
          onCloseAutoFocus={(e) => {
            if (!goToRegistry.current) return;
            goToRegistry.current = false;
            e.preventDefault();
            const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            document.getElementById('registry')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          }}
          className={cn(
            'fixed left-1/2 top-[8vh] z-50 flex max-h-[84vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col',
            'rounded-[8px] border border-zf-grid bg-zf-surface text-zf-text outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-150 data-[state=open]:ease-out',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-100',
            'motion-reduce:animate-none',
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-zf-grid py-2 pl-5 pr-2">
            <DialogPrimitive.Title className="text-lg font-medium text-zf-text">Find by task</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] text-zf-muted transition-colors duration-150 hover:bg-zf-raised hover:text-zf-text"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
            <label htmlFor="task-finder-brief" className="text-sm font-medium text-zf-text">
              Describe the job
            </label>
            <textarea
              id="task-finder-brief"
              ref={textareaRef}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="Describe the job, e.g. reconcile Stripe payouts against invoices every Friday"
              className="mt-2 block w-full resize-y rounded-[4px] border border-zf-grid bg-zf-canvas px-3 py-2.5 text-base text-zf-text placeholder:text-zf-muted/80 focus:border-zf-blue focus:outline-none focus-visible:outline-2 focus-visible:outline-zf-blue"
            />

            <div className="mt-3">
              <p className="text-sm text-zf-muted">Try an example</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <li key={ex}>
                    <button
                      type="button"
                      onClick={() => fillExample(ex)}
                      className="min-h-11 rounded-[4px] border border-zf-grid px-3 py-2 text-left text-sm text-zf-text transition-colors duration-150 hover:border-zf-muted hover:bg-zf-raised"
                    >
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5" aria-live="polite">
              {hasQuery && results.length > 0 && (
                <>
                  <p className="text-sm text-zf-muted">
                    {results.length === 1 ? '1 listing matched' : `${results.length} listings matched`}, best first
                  </p>
                  <ul aria-label="Matching listings" className="mt-2 divide-y divide-zf-grid rounded-[4px] border border-zf-grid">
                    {results.map(({ product, matched }) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => openResult(product)}
                          className="flex min-h-11 w-full flex-col gap-1 px-3 py-3 text-left transition-colors duration-150 hover:bg-zf-raised"
                        >
                          <span className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-sm font-medium text-zf-text">{product.title}</span>
                            <AegisMeter score={aegisScore(product)} />
                          </span>
                          <span className="max-w-full truncate font-mono text-xs text-zf-muted">{registryId(product)}</span>
                          <span className="text-xs text-zf-muted">
                            Matched: <span className="text-zf-text">{matched.join(', ')}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {hasQuery && results.length === 0 && (
                <div className="rounded-[4px] border border-zf-grid px-4 py-4">
                  <p className="text-sm font-medium text-zf-text">No listing matches those words.</p>
                  <p className="mt-1 text-sm text-zf-muted">
                    Try naming the tool it should work with or the output you want, or search the registry and browse by
                    category instead.
                  </p>
                  <button
                    type="button"
                    onClick={browseRegistry}
                    className="mt-3 inline-flex min-h-11 items-center rounded-[4px] bg-zf-raised px-4 text-sm font-medium text-zf-text transition-colors duration-150 hover:bg-zf-grid"
                  >
                    Search the registry
                  </button>
                </div>
              )}
            </div>

            <DialogPrimitive.Description className="mt-5 text-xs text-zf-muted">
              Keyword match over listing capabilities and tags. No model call, nothing leaves your browser.
            </DialogPrimitive.Description>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
