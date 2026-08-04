'use client'

import { useEffect, useRef, useState } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatCount } from '@/lib/format'
import { bucketWeekly, dayLabel } from '@/lib/analytics/stats-format'
import type { SeriesPoint, StatsWindow } from '@/lib/analytics/stats-types'

export interface ViewsOverTimeProps {
  series: SeriesPoint[]
  window: StatsWindow
}

const WEEKLY_THRESHOLD = 60
const FIRST_DRAW_MS = 900

function barStyle(heightPct: number, entered: boolean, everDrawn: boolean, reduced: boolean, index: number) {
  if (reduced) return { height: `${heightPct}%` }
  if (!everDrawn) {
    return {
      height: `${heightPct}%`,
      transformOrigin: 'bottom' as const,
      transform: entered ? 'scaleY(1)' : 'scaleY(0)',
      transition: `transform ${FIRST_DRAW_MS}ms var(--ease-out) ${Math.min(index, 7) * 40}ms`,
    }
  }
  return {
    height: `${heightPct}%`,
    transform: 'none',
    transition: 'height var(--dur-base) var(--ease-out)',
  }
}

/**
 * Daily page views as bars, distinct visits as a separate-mark-type line, sharing one y scale
 * since a visit is always at most as large as its view count for the same day.
 */
export function ViewsOverTime({ series, window: statsWindow }: ViewsOverTimeProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered
  const [everDrawn, setEverDrawn] = useState(false)
  const lineRef = useRef<SVGPolylineElement>(null)
  const [lineLength, setLineLength] = useState(0)

  const isWeekly = statsWindow === 'all' && series.length > WEEKLY_THRESHOLD
  const points = isWeekly ? bucketWeekly(series) : series
  const n = points.length
  const maxViews = Math.max(1, ...points.map((p) => p.views))
  const step = Math.max(1, Math.ceil(n / 7))

  useEffect(() => {
    if (!entered || everDrawn) return
    const id = globalThis.setTimeout(() => setEverDrawn(true), FIRST_DRAW_MS + 7 * 40 + 50)
    return () => globalThis.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered])

  useEffect(() => {
    if (lineRef.current) setLineLength(lineRef.current.getTotalLength())
  }, [points])

  const linePoints = points
    .map((point, index) => {
      const x = n > 0 ? ((index + 0.5) / n) * 100 : 0
      const y = 100 - (point.visits / maxViews) * 100
      return `${x},${y}`
    })
    .join(' ')

  const totalViews = points.reduce((sum, p) => sum + p.views, 0)
  const peak = points.reduce((best, p) => (p.views > best.views ? p : best), points[0] ?? { day: '', views: 0, visits: 0 })

  const rangeLabel =
    n > 0 ? `${dayLabel(points[0].day)} to ${dayLabel(points[n - 1].day)}` : 'no data yet'
  const chartLabel =
    n > 0
      ? `Page views from ${rangeLabel}, totaling ${formatCount(totalViews)} views, peaking on ${dayLabel(peak.day)} with ${formatCount(peak.views)} views.`
      : 'No page view data in this window yet.'

  const tableRows = points.map((point) => ({
    day: isWeekly ? `Week of ${dayLabel(point.day)}` : dayLabel(point.day),
    views: formatCount(point.views),
    visits: formatCount(point.visits),
  }))

  return (
    <Figure
      eyebrow="DAILY TRAFFIC"
      title="Page views and visits, by day"
      caption={
        isWeekly
          ? 'Bars are page views per week.'
          : 'Bars are page views. The line is distinct visits, counted per UTC day.'
      }
      source="This site's own event table, read live from the analytics worker. Days with no traffic are drawn as zero, not skipped."
      well={{ height: 320, heightSm: 300 }}
      table={
        <FigureTable
          caption={isWeekly ? 'Weekly totals, keyed by the Monday each week starts.' : 'Daily page views and visits.'}
          columns={[
            { key: 'day', label: 'Day' },
            { key: 'views', label: 'Page views', align: 'right' },
            { key: 'visits', label: 'Visits', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-1" role="img" aria-label={chartLabel}>
        <div className="flex min-h-0 flex-1 gap-2">
          <div className="flex w-10 flex-shrink-0 flex-col justify-between py-0.5 text-right text-tick text-text-tertiary">
            <span>{formatCount(maxViews)}</span>
            <span>{formatCount(Math.round(maxViews / 2))}</span>
            <span>0</span>
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
              <div className="h-px bg-(--viz-hairline)" />
              <div className="h-px bg-(--viz-hairline)" />
              <div className="h-px bg-(--viz-hairline)" />
            </div>
            <div className="relative flex h-full items-end gap-px" aria-hidden="true">
              {points.map((point, index) => (
                <div key={point.day} className="flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-[1px]"
                    style={{
                      backgroundColor: 'var(--viz-cat-1)',
                      border: '0.5px solid var(--viz-hairline)',
                      ...barStyle((point.views / maxViews) * 100, entered, everDrawn, reduced, index),
                    }}
                  />
                </div>
              ))}
            </div>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <polyline
                ref={lineRef}
                points={linePoints}
                fill="none"
                stroke="var(--viz-cat-6)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                style={
                  reduced
                    ? undefined
                    : {
                        strokeDasharray: lineLength || 1,
                        strokeDashoffset: entered ? 0 : lineLength || 1,
                        transition: `stroke-dashoffset ${FIRST_DRAW_MS}ms var(--ease-out)`,
                      }
                }
              />
            </svg>
            {points.map((point, index) => {
              const x = n > 0 ? ((index + 0.5) / n) * 100 : 0
              const y = (point.visits / maxViews) * 100
              return (
                <span
                  key={point.day}
                  aria-hidden="true"
                  className="absolute h-[3px] w-[3px] -translate-x-1/2 translate-y-1/2"
                  style={{ left: `${x}%`, bottom: `${y}%`, backgroundColor: 'var(--viz-cat-6)' }}
                />
              )
            })}
          </div>
        </div>
        <div className="ml-12 flex text-tick text-text-tertiary" aria-hidden="true">
          {points.map((point, index) => (
            <span key={point.day} className="flex-1 truncate text-center">
              {index % step === 0 ? dayLabel(point.day) : ''}
            </span>
          ))}
        </div>
        <div className="ml-12 flex items-center gap-4 text-tick text-text-tertiary" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-[1px]" style={{ backgroundColor: 'var(--viz-cat-1)' }} />
            Page views
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="14" y2="4" stroke="var(--viz-cat-6)" strokeWidth="1.5" />
              <rect x="5.5" y="2.5" width="3" height="3" fill="var(--viz-cat-6)" />
            </svg>
            Visits
          </span>
        </div>
      </div>
    </Figure>
  )
}
