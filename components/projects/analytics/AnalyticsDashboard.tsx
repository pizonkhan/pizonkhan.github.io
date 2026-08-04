'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { Figure } from '@/components/viz/Figure'
import { EmptyWell } from './EmptyWell'
import { WindowControl } from './WindowControl'
import { LiveMetrics } from './LiveMetrics'
import { ViewsOverTime } from './ViewsOverTime'
import { TopPagesBars } from './TopPagesBars'
import { TopClicksList } from './TopClicksList'
import { DwellHistogram } from './DwellHistogram'
import { AudienceBreakdown } from './AudienceBreakdown'
import { PipelineFlow } from './PipelineFlow'
import { STATS_URL } from '@/lib/analytics/config'
import { fetchStats } from '@/lib/analytics/stats-client'
import { fillSeries } from '@/lib/analytics/stats-format'
import type { StatsPayload, StatsWindow } from '@/lib/analytics/stats-types'

type Status =
  | { kind: 'unconfigured' }
  | { kind: 'loading' }
  | { kind: 'ready'; payload: StatsPayload }
  | { kind: 'error' }

interface StoreState {
  window: StatsWindow
  status: Status
}

const TIMEOUT_MS = 8000

/**
 * Module-scope, not component state: AnalyticsDashboard (the centrepiece) and PipelineSection
 * (mounted separately, inside the "pipeline" theory section further down the page) both need
 * the same window selection and the same /stats response, and they share no React ancestor.
 * A single external store is what lets the whole page make exactly one request per window,
 * the "single fetch" the component contract promises, instead of each mount point fetching on
 * its own.
 */
let state: StoreState = { window: '7d', status: STATS_URL ? { kind: 'loading' } : { kind: 'unconfigured' } }
const listeners = new Set<() => void>()
let controller: AbortController | null = null
let started = false

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function load(window: StatsWindow) {
  if (!STATS_URL) return
  controller?.abort()
  const nextController = new AbortController()
  controller = nextController
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    nextController.abort()
  }, TIMEOUT_MS)

  fetchStats(window, { signal: nextController.signal })
    .then((payload) => {
      if (nextController.signal.aborted) return
      state = { window, status: { kind: 'ready', payload } }
      emit()
    })
    .catch(() => {
      if (nextController.signal.aborted && !timedOut) return
      state = { window, status: { kind: 'error' } }
      emit()
    })
    .finally(() => clearTimeout(timeout))
}

function setWindow(next: StatsWindow) {
  if (state.window === next) return
  state = { window: next, status: STATS_URL ? { kind: 'loading' } : { kind: 'unconfigured' } }
  emit()
  load(next)
}

function retry() {
  if (!STATS_URL) return
  state = { window: state.window, status: { kind: 'loading' } }
  emit()
  load(state.window)
}

function ensureStarted() {
  if (started) return
  started = true
  if (STATS_URL) load(state.window)
}

function useAnalyticsStats() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  useEffect(() => {
    ensureStarted()
  }, [])
  return snapshot
}

function statusMessage(kind: 'unconfigured' | 'loading' | 'error'): string {
  if (kind === 'unconfigured') return 'No analytics endpoint is configured in this build.'
  if (kind === 'error') return 'Could not read the analytics worker.'
  return 'Reading the analytics worker.'
}

interface ChromeEntry {
  key: string
  eyebrow: string
  title: string
  caption?: string
  source: string
  well: { height: number; heightSm?: number }
}

const CHROME: readonly ChromeEntry[] = [
  {
    key: 'series',
    eyebrow: 'DAILY TRAFFIC',
    title: 'Page views and visits, by day',
    source: "This site's own event table, read live from the analytics worker.",
    well: { height: 320, heightSm: 300 },
  },
  {
    key: 'pages',
    eyebrow: 'MOST READ',
    title: 'Pages ranked by views',
    source: "This site's own event table, read live from the analytics worker.",
    well: { height: 380, heightSm: 420 },
  },
  {
    key: 'clicks',
    eyebrow: 'MOST CLICKED',
    title: 'Links and sections people actually click',
    source: "This site's own event table, read live from the analytics worker.",
    well: { height: 380, heightSm: 460 },
  },
  {
    key: 'dwell',
    eyebrow: 'TIME ON PAGE',
    title: 'How long people actually stay',
    source: "This site's own duration readings, read live from the analytics worker.",
    well: { height: 300, heightSm: 320 },
  },
  {
    key: 'audience',
    eyebrow: "WHO'S READING",
    title: 'Device, referrer and country',
    source: "This site's own event table, read live from the analytics worker.",
    well: { height: 320, heightSm: 460 },
  },
]

const PIPELINE_CHROME: ChromeEntry = {
  key: 'pipeline',
  eyebrow: 'THE PIPELINE',
  title: 'From a beacon to a row on this page',
  source: "Live counts from the same /stats response this page's other figures read.",
  well: { height: 220, heightSm: 420 },
}

function emptyWellKind(kind: 'unconfigured' | 'loading' | 'error'): 'empty' | 'error' | 'unconfigured' {
  if (kind === 'loading') return 'empty'
  return kind
}

function PlaceholderFigure({ chrome, kind, onRetry }: { chrome: ChromeEntry; kind: 'unconfigured' | 'loading' | 'error'; onRetry?: () => void }) {
  return (
    <Figure eyebrow={chrome.eyebrow} title={chrome.title} source={chrome.source} well={chrome.well}>
      <EmptyWell kind={emptyWellKind(kind)} message={statusMessage(kind)} onRetry={onRetry} />
    </Figure>
  )
}

/**
 * Owns the page's single /stats request, the selected window, and the loading, ready, error
 * and unconfigured state machine. Renders every figure except the pipeline diagram, which
 * mounts separately, further down the page, through PipelineSection below.
 */
export function AnalyticsDashboard() {
  const { window: selectedWindow, status } = useAnalyticsStats()

  const filledSeries = useMemo(() => {
    if (status.kind !== 'ready') return []
    const payload = status.payload
    if (payload.window === 'all') {
      const first = payload.series[0]?.day ?? payload.endDay
      return fillSeries(payload.series, first, payload.endDay)
    }
    return fillSeries(payload.series, payload.startDay, payload.endDay)
  }, [status])

  const disabled = status.kind !== 'ready'

  return (
    <div className="flex flex-col gap-(--space-block)">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {status.kind === 'ready' ? (
          <LiveMetrics
            totals={status.payload.totals}
            today={status.payload.today}
            generatedAt={status.payload.generatedAt}
            window={status.payload.window}
          />
        ) : (
          <p className="min-h-[300px] text-small text-text-secondary sm:min-h-[170px]">
            {statusMessage(status.kind)}
          </p>
        )}
        <WindowControl value={selectedWindow} onChange={setWindow} disabled={disabled} />
      </div>

      {status.kind === 'ready' ? (
        <>
          <ViewsOverTime series={filledSeries} window={status.payload.window} />
          <div className="grid grid-cols-1 gap-(--space-block) lg:grid-cols-2">
            <TopPagesBars pages={status.payload.topPages} window={status.payload.window} />
            <TopClicksList clicks={status.payload.topClicks} />
          </div>
          <div className="grid grid-cols-1 gap-(--space-block) lg:grid-cols-2">
            <DwellHistogram buckets={status.payload.durationBuckets} medianKind={status.payload.totals.medianKind} />
            <AudienceBreakdown
              devices={status.payload.devices}
              referrers={status.payload.referrers}
              countries={status.payload.countries}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-(--space-block)">
          <PlaceholderFigure
            chrome={CHROME[0]}
            kind={status.kind}
            onRetry={status.kind === 'error' ? retry : undefined}
          />
          <div className="grid grid-cols-1 gap-(--space-block) lg:grid-cols-2">
            <PlaceholderFigure
              chrome={CHROME[1]}
              kind={status.kind}
              onRetry={status.kind === 'error' ? retry : undefined}
            />
            <PlaceholderFigure
              chrome={CHROME[2]}
              kind={status.kind}
              onRetry={status.kind === 'error' ? retry : undefined}
            />
          </div>
          <div className="grid grid-cols-1 gap-(--space-block) lg:grid-cols-2">
            <PlaceholderFigure
              chrome={CHROME[3]}
              kind={status.kind}
              onRetry={status.kind === 'error' ? retry : undefined}
            />
            <PlaceholderFigure
              chrome={CHROME[4]}
              kind={status.kind}
              onRetry={status.kind === 'error' ? retry : undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Mounted separately, inside the "pipeline" theory section. Reads the same shared store as
 * AnalyticsDashboard above rather than issuing its own request: the two mount points never
 * fetch independently.
 */
export function PipelineSection() {
  const { status } = useAnalyticsStats()

  if (status.kind === 'ready') {
    return <PipelineFlow pipeline={status.payload.pipeline} />
  }

  return (
    <PlaceholderFigure
      chrome={PIPELINE_CHROME}
      kind={status.kind}
      onRetry={status.kind === 'error' ? retry : undefined}
    />
  )
}
