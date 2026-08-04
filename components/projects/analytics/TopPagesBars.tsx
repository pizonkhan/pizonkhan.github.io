'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { EmptyWell } from './EmptyWell'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatCount } from '@/lib/format'
import { formatSeconds, shortPath } from '@/lib/analytics/stats-format'
import type { PageRow, StatsWindow } from '@/lib/analytics/stats-types'

export interface TopPagesBarsProps {
  pages: PageRow[]
  window: StatsWindow
}

/**
 * Ranked horizontal bars, same row layout as ImportanceBars: label, right-aligned value, bar
 * filling the remainder. One channel only, top row in --text-primary, the rest --text-tertiary.
 */
export function TopPagesBars({ pages, window }: TopPagesBarsProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const maxViews = Math.max(1, ...pages.map((page) => page.views))

  const tableRows = pages.map((page) => ({
    path: page.path,
    views: formatCount(page.views),
    visits: formatCount(page.visits),
    avg: page.avgSeconds === null ? 'no readings' : formatSeconds(page.avgSeconds),
    median: window === 'all' ? 'not computed' : page.medianSeconds === null ? 'no readings' : formatSeconds(page.medianSeconds),
  }))

  return (
    <Figure
      eyebrow="MOST READ"
      title="Pages ranked by views"
      caption="Top 8 pages this window, most views first."
      source="This site's own event table, read live from the analytics worker."
      well={{ height: 380, heightSm: 420 }}
      table={
        <FigureTable
          caption={
            window === 'all'
              ? "Page-level totals. The all-time window's median time on page is not computed per page, only estimated site-wide."
              : 'Page-level totals for this window.'
          }
          columns={[
            { key: 'path', label: 'Page' },
            { key: 'views', label: 'Page views', align: 'right' },
            { key: 'visits', label: 'Visits', align: 'right' },
            { key: 'avg', label: 'Average time', align: 'right' },
            { key: 'median', label: 'Median time', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      {pages.length === 0 ? (
        <EmptyWell kind="empty" message="No page views in this window yet." />
      ) : (
        <div ref={ref} className="flex h-full flex-col justify-between py-1">
          {pages.map((page, index) => {
            const isTop = index === 0
            const widthPct = (page.views / maxViews) * 100
            const delay = `${Math.min(index, 7) * 40}ms`

            return (
              <div key={page.path} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className="order-1 w-[calc(100%-6rem)] truncate text-small text-text-primary sm:w-56 sm:flex-shrink-0 lg:w-64"
                  title={page.path}
                >
                  {shortPath(page.path)}
                </span>
                <span className="order-2 w-20 flex-shrink-0 text-right text-tick tabular-nums text-text-secondary sm:order-3 sm:w-24">
                  {formatCount(page.views)}
                </span>
                <div className="relative order-3 h-4 w-full sm:order-2 sm:w-auto sm:flex-1">
                  <div
                    className="h-full origin-left rounded-[2px]"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: isTop ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      border: '0.5px solid var(--viz-hairline)',
                      transform: `scaleX(${entered ? 1 : 0})`,
                      transition: reduced ? 'none' : `transform 900ms var(--ease-out) ${delay}`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Figure>
  )
}
