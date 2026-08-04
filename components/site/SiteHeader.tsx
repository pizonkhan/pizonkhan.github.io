import Link from 'next/link'
import { site } from '@/content/site'
import { Wordmark } from '@/components/site/Wordmark'
import { ThemeToggle } from '@/components/site/ThemeToggle'

/** Sticky header: wordmark, nav from content/site.ts, theme toggle. */
export function SiteHeader() {
  return (
    <header data-section="site-header" className="sticky top-0 z-40 border-b border-border-subtle bg-surface-0/90 backdrop-blur">
      <div className="mx-auto flex max-w-(--width-content) items-center justify-between px-6 py-3 sm:px-8">
        <Wordmark height={32} asLink />
        <nav aria-label="Primary" className="flex items-center gap-6">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-small text-text-secondary transition-colors duration-(--dur-fast) hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
