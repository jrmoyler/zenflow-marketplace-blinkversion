import { Wordmark } from '@/components/brand/Mark';

const LINKS = [
  { href: '#registry', label: 'Registry' },
  { href: '#aegis-standard', label: 'Aegis standard' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-zf-grid bg-zf-canvas">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_auto] lg:px-8">
        <div className="max-w-md space-y-3">
          <Wordmark markSize={28} />
          <p className="text-sm leading-relaxed text-zf-muted">
            ZenFlow is the Collective AI division that runs Zenith OS. Every listing in this registry is published by
            a Collective AI department and runs internally before it is listed.
          </p>
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="text-sm font-medium text-zf-text">Publishing standard</h2>
          <p className="text-sm leading-relaxed text-zf-muted">
            Every listing declares the data scopes it touches, what it refuses to do, and the triggers that escalate
            to a person. Aegis scores each declaration from 0 to 100.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex gap-6 md:flex-col md:gap-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center rounded-sm text-sm text-zf-blue-text transition-colors duration-150 hover:text-zf-text md:min-h-0"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-zf-grid">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-zf-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Catalog in internal validation. Pricing is provisional.</p>
          <p>&copy; {year} Collective AI</p>
        </div>
      </div>
    </footer>
  );
}
