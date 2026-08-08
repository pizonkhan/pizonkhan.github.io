import Link from 'next/link'
import { site } from '@/content/site'
import { Wordmark } from '@/components/site/Wordmark'
import { ThemeToggle } from '@/components/site/ThemeToggle'

/** Sticky header: wordmark, nav from content/site.ts, theme toggle. */
export function SiteHeader() {
  return (
    <header data-section="site-header" className="sticky top-0 z-40 border-b border-border-subtle bg-surface-0/90 backdrop-blur">
      <div className="mx-auto flex max-w-(--width-content) flex-wrap items-center justify-between gap-y-2 px-4 py-3 min-[375px]:flex-nowrap sm:px-8">
        <Wordmark height={32} asLink />
        <nav
          aria-label="Primary"
          className="order-2 flex items-center gap-2 min-[375px]:order-none sm:gap-6"
        >
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-small text-text-secondary transition-colors duration-(--dur-fast) hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle className="order-1 min-[375px]:order-none" />
      </div>
    </header>
  )
}
