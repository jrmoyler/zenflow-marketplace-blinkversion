import { useCallback, useEffect, useRef, useState } from 'react';
import { ListChecks, Search, X } from 'lucide-react';
import { Wordmark } from '@/components/brand/Mark';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onOpenTaskFinder: () => void;
}

const SEARCH_ID = 'zf-registry-search';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export default function Navbar({ query, onQueryChange, onOpenTaskFinder }: NavbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focusPending = useRef(false);
  // Mobile only: whether the full-width search row is shown. Desktop always shows the field.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const focusSearch = useCallback(() => {
    focusPending.current = true;
    setMobileSearchOpen(true);
    inputRef.current?.focus();
  }, []);

  // The mobile row is display:none until opened, so focus once it has rendered.
  useEffect(() => {
    if (mobileSearchOpen && focusPending.current) {
      focusPending.current = false;
      inputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isSlash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditableTarget(e.target);
      if (isCmdK || isSlash) {
        e.preventDefault();
        focusSearch();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusSearch]);

  function closeSearch() {
    onQueryChange('');
    inputRef.current?.blur();
    setMobileSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zf-grid bg-zf-canvas/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <a
          href="/"
          aria-label="ZenFlow Marketplace home"
          className="flex min-h-[44px] shrink-0 items-center rounded-sm"
        >
          <Wordmark markSize={24} labelClassName="hidden md:inline" />
        </a>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className={cn(
            mobileSearchOpen ? 'flex' : 'hidden',
            'absolute inset-x-0 top-14 border-b border-zf-grid bg-zf-canvas px-4 py-2',
            'sm:static sm:flex sm:max-w-md sm:flex-1 sm:border-0 sm:bg-transparent sm:p-0'
          )}
        >
          <div className="relative w-full">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zf-muted"
            />
            <input
              ref={inputRef}
              id={SEARCH_ID}
              type="search"
              aria-label="Search the registry"
              placeholder="Search agents, workflows, integrations"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closeSearch();
                }
              }}
              className={cn(
                'h-11 w-full rounded-[4px] border border-zf-grid bg-zf-surface pl-9 pr-10 text-sm text-zf-text sm:h-9',
                'placeholder:text-zf-muted/80 transition-[border-color,background-color] duration-150',
                'hover:border-zf-muted/40 focus:border-zf-blue focus:bg-zf-raised'
              )}
            />
            {query === '' && (
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-[4px] border border-zf-grid bg-zf-raised px-1.5 py-0.5 font-mono text-[11px] leading-none text-zf-muted sm:block"
              >
                /
              </kbd>
            )}
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => (mobileSearchOpen ? closeSearch() : focusSearch())}
            aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
            aria-expanded={mobileSearchOpen}
            aria-controls={SEARCH_ID}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] text-zf-muted transition-colors duration-150 hover:bg-zf-raised hover:text-zf-text sm:hidden"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={onOpenTaskFinder}
            className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[4px] border border-zf-grid bg-zf-surface px-3 text-sm font-medium text-zf-text transition-[border-color,background-color] duration-150 hover:border-zf-violet/60 hover:bg-zf-raised sm:h-9"
          >
            <ListChecks className="h-4 w-4 text-zf-violet-text" aria-hidden="true" />
            Find by task
          </button>
        </div>
      </div>
    </header>
  );
}
