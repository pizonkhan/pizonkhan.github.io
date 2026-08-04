import { AnimatedNumber } from '@/components/viz/AnimatedNumber'
import { Metric } from '@/components/ui/Metric'
import { formatCount } from '@/lib/format'
import { formatSeconds } from '@/lib/analytics/stats-format'
import type { StatsPayload, StatsWindow } from '@/lib/analytics/stats-types'

export interface LiveMetricsProps {
  totals: StatsPayload['totals']
  today: StatsPayload['today']
  generatedAt: number
  window: StatsWindow
}

const WINDOW_LABEL: Record<StatsWindow, string> = {
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  all: 'since launch',
}

function medianSource(totals: StatsPayload['totals']): string {
  if (totals.medianKind === 'estimated') return 'Estimated from the daily histogram.'
  if (totals.medianKind === 'none') return 'No time readings in this window yet.'
  return 'Exact median over this window.'
}

function pluralize(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`
}

/** The four headline live numbers, plus the freshness line. Owns no fetch, no layout beyond its own grid. */
export function LiveMetrics({ totals, today, generatedAt, window }: LiveMetricsProps) {
  const readAt = new Date(generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        <Metric
          value={<AnimatedNumber value={totals.views} format={formatCount} />}
          label="Page views"
          source={WINDOW_LABEL[window]}
        />
        <Metric
          value={<AnimatedNumber value={totals.visits} format={formatCount} />}
          label="Visits"
          source={WINDOW_LABEL[window]}
        />
        <Metric
          value={<AnimatedNumber value={totals.clicks} format={formatCount} />}
          label="Clicks"
          source={WINDOW_LABEL[window]}
        />
        <Metric
          value={<AnimatedNumber value={totals.medianSeconds ?? 0} format={formatSeconds} />}
          label="Median time on page"
          source={medianSource(totals)}
        />
      </div>
      <p className="text-small text-text-secondary">
        Today: {formatCount(today.views)} {pluralize(today.views, 'view')}, {formatCount(today.visits)}{' '}
        {pluralize(today.visits, 'visit')} &middot;{' '}
        <time dateTime={new Date(generatedAt).toISOString()} className="text-text-tertiary">
          Read at {readAt}
        </time>
      </p>
    </div>
  )
}
