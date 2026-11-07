import { ALL_DIVISIONS_URL, HUB_URL, MAIN_URL, divisionUrl } from '@/lib/network';

/**
 * The parent strip every Collective AI division page carries (collective-ai-divisions
 * build/shell.js `.parent-strip`). Not sticky: it scrolls away and the Navbar sticks.
 */
export function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" d="M10 0 L12.4 7.6 L20 10 L12.4 12.4 L10 20 L7.6 12.4 L0 10 L7.6 7.6 Z" />
    </svg>
  );
}

const link = 'inline-flex min-h-[28px] items-center gap-2 no-underline transition-colors duration-150 hover:text-zf-text';

export default function ParentStrip() {
  return (
    <nav
      aria-label="Collective AI network"
      className="relative z-[41] border-b border-[#1A2540] bg-[#050A18] text-[13px] text-zf-muted"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5 px-4 py-2 sm:px-6 lg:px-8">
        <a href={MAIN_URL} rel="noopener" className={link}>
          <Star className="h-2.5 w-2.5 flex-none text-[#D4A843]" />
          <span>A Collective AI Inc. division</span>
        </a>
        <span className="inline-flex items-center gap-[18px]">
          <a href={ALL_DIVISIONS_URL} rel="noopener" className={`${link} hidden sm:inline-flex`}>
            All divisions
          </a>
          <a href={divisionUrl('zenflow')} rel="noopener" className={`${link} hidden sm:inline-flex`}>
            ZenFlow site
          </a>
          <a href={HUB_URL} rel="noopener" className={`${link} text-[#D4A843]`}>
            Not sure? Start here
          </a>
        </span>
      </div>
    </nav>
  );
}
