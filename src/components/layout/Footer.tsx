import { Mark, Wordmark } from '@/components/brand/Mark';
import { ASSESSMENT_URL, DIVISIONS, HUB_URL, MAIN_URL, divisionUrl } from '@/lib/network';
import { Star } from './ParentStrip';

const LINKS = [
  { href: '#registry', label: 'Registry' },
  { href: '#aegis-standard', label: 'Aegis standard' },
];

const NETWORK = [
  { href: MAIN_URL, label: 'collectiveai.info' },
  { href: HUB_URL, label: 'Start here hub', gold: true },
  { href: ASSESSMENT_URL, label: 'AI Readiness Audit' },
  { href: divisionUrl('zenflow'), label: 'ZenFlow division site' },
];

const OTHER_DIVISIONS = DIVISIONS.filter((d) => d.slug !== 'zenflow');

const linkCls =
  'inline-flex min-h-[44px] items-center gap-2 rounded-sm text-sm text-zf-blue-text transition-colors duration-150 hover:text-zf-text md:min-h-[32px]';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-zf-grid bg-zf-canvas">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_auto_auto_auto] lg:gap-14 lg:px-8">
        <div className="max-w-md space-y-3">
          <Wordmark markSize={32} />
          <p className="text-sm leading-relaxed text-zf-muted">
            AI agents you can audit. ZenFlow is the Collective AI division that builds agents that do the work and show
            their reasoning. Every listing here runs inside a Collective AI division before it is listed, and writes
            each decision to a decision log you can read.
          </p>
          <p className="text-sm leading-relaxed text-zf-muted">
            Every listing declares the data scopes it touches, what it refuses to do, and the triggers that escalate to a
            person. Aegis scores each declaration from 0 to 100.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-2 text-sm font-medium text-zf-text">Marketplace</h2>
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkCls}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Collective AI network">
          <h2 className="mb-2 text-sm font-medium text-zf-text">Collective AI network</h2>
          <ul className="flex flex-col">
            {NETWORK.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  rel="noopener"
                  className={link.gold ? `${linkCls} !text-[#D4A843] hover:!text-zf-text` : linkCls}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Other divisions">
          <h2 className="mb-2 text-sm font-medium text-zf-text">Other divisions</h2>
          <ul className="grid grid-cols-2 gap-x-6 md:grid-cols-1">
            {OTHER_DIVISIONS.map((d) => (
              <li key={d.slug}>
                <a href={divisionUrl(d.slug)} rel="noopener" className={linkCls}>
                  <Mark division={d.slug} size={18} title="" />
                  {d.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-zf-grid">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-zf-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Catalog in internal validation. Pricing is provisional.</p>
          <p className="inline-flex items-center gap-2">
            <Star className="h-2.5 w-2.5 text-[#D4A843]" />
            <a href={MAIN_URL} rel="noopener" className="hover:text-zf-text">
              A Collective AI Inc. division
            </a>
            <span>&copy; {year} Collective AI</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
