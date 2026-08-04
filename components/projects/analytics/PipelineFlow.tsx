'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { usePrefersReducedMotion } from '@/lib/motion'
import { formatCount } from '@/lib/format'
import type { StatsPayload } from '@/lib/analytics/stats-types'

export interface PipelineFlowProps {
  pipeline: StatsPayload['pipeline'] | null
}

interface Stage {
  label: string
  sub: string
  liveNumber: (pipeline: StatsPayload['pipeline']) => string | null
}

const STAGES: readonly Stage[] = [
  { label: 'Beacon', sub: 'sendBeacon, one string, no preflight', liveNumber: () => null },
  { label: 'Worker', sub: 'origin check, validation, bot filter', liveNumber: () => null },
  { label: 'event', sub: 'D1 landing table, append only', liveNumber: (p) => `${formatCount(p.rawEvents)} rows` },
  { label: 'Rollup', sub: 'cron, 01:17 UTC, all aggregation in SQL', liveNumber: (p) => (p.lastRunMs === null ? null : `${p.lastRunMs} ms`) },
  { label: 'daily_*', sub: 'seven serving tables', liveNumber: (p) => `${formatCount(p.rolledDays)} days` },
  { label: 'This page', sub: 'one request, one batch', liveNumber: () => null },
]

const CYCLE_MS = 3600
const HOP_MS = CYCLE_MS / STAGES.length
const PAUSE_MS = 1500

/** A continuously-updating viewport observer, unlike useInViewOnce's one-shot latch: this loop needs to re-pause every time the figure leaves the screen, not just the first time. */
function useLiveInView<T extends Element>(): [(node: T | null) => void, boolean] {
  const [node, setNode] = useState<T | null>(null)
  const [visible, setVisible] = useState(false)
  const ref = useCallback((next: T | null) => setNode(next), [])

  useEffect(() => {
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting)
      },
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [ref, visible]
}

function stageLiveNumber(stage: Stage, pipeline: StatsPayload['pipeline'] | null): string {
  if (!pipeline) return 'not available'
  return stage.liveNumber(pipeline) ?? ''
}

/**
 * The page's answer to "what moves here": six stages, an accent dot gliding across them on a
 * loop, real counts attached to the three stages that have one. Pauses whenever the tab is
 * hidden or the figure scrolls off screen, so it never burns frames nobody can see.
 */
export function PipelineFlow({ pipeline }: PipelineFlowProps) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useLiveInView<HTMLDivElement>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [dotPercent, setDotPercent] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const cycleStartRef = useRef<number | null>(null)
  const hiddenRef = useRef(false)

  useEffect(() => {
    hiddenRef.current = document.hidden
    function onVisibilityChange() {
      hiddenRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (reduced) return
    const running = inView && !hiddenRef.current

    if (!running) {
      cycleStartRef.current = null
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      return
    }

    function tick(now: number) {
      if (hiddenRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      if (cycleStartRef.current === null) cycleStartRef.current = now
      const period = CYCLE_MS + PAUSE_MS
      const elapsed = (now - cycleStartRef.current) % period

      if (elapsed < CYCLE_MS) {
        setDotPercent((elapsed / CYCLE_MS) * 100)
        setActiveIndex(Math.min(STAGES.length - 1, Math.floor(elapsed / HOP_MS)))
      } else {
        setDotPercent(null)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [reduced, inView])

  const tableRows = STAGES.map((stage) => ({
    stage: stage.label,
    what: stage.sub,
    live: stageLiveNumber(stage, pipeline),
  }))

  return (
    <Figure
      eyebrow="THE PIPELINE"
      title="From a beacon to a row on this page"
      caption={
        reduced
          ? 'Beacon, Worker, landing table, nightly rollup, serving tables, this page: the order every event travels.'
          : 'An accent dot traces one event from the browser to the row this page just read.'
      }
      source="Live counts from the same /stats response this page's other figures read."
      well={{ height: 220, heightSm: 420 }}
      disclosureLabel="Show the stages"
      table={
        <FigureTable
          caption="The six pipeline stages, what each does, and its live number."
          columns={[
            { key: 'stage', label: 'Stage' },
            { key: 'what', label: 'What happens' },
            { key: 'live', label: 'Live number', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full items-center">
        <div className="relative flex w-full flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
          {/* Vertical rail for the stacked mobile layout: the same accent dot travels down
              this left-edge line instead of across the row, so the pipeline still visibly
              moves below the sm breakpoint rather than falling back to border colour alone. */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-1.5 top-0 w-px sm:hidden"
            style={{ backgroundColor: 'var(--border-subtle)' }}
          />
          {!reduced && dotPercent !== null && (
            <>
              <span
                aria-hidden="true"
                className="absolute left-1.5 block h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:hidden"
                style={{ top: `${dotPercent}%`, backgroundColor: 'var(--accent)' }}
              />
              <span
                aria-hidden="true"
                className="absolute top-1/2 hidden h-[5px] w-[5px] -translate-y-1/2 rounded-full sm:block"
                style={{ left: `${dotPercent}%`, backgroundColor: 'var(--accent)' }}
              />
            </>
          )}
          {STAGES.map((stage, index) => {
            const lit = reduced || index === activeIndex
            return (
              <Fragment key={stage.label}>
                <div
                  className="flex flex-1 flex-col items-center gap-1 rounded-md border p-2.5 text-center transition-colors duration-(--dur-base)"
                  style={{ borderColor: lit ? 'var(--accent)' : 'var(--border-subtle)' }}
                >
                  {/*
                    No color transition here, unlike the border above: interpolating text
                    color through the intermediate blend between --text-secondary and
                    --text-primary briefly drops below WCAG AA contrast in dark theme, measured
                    with axe-core mid-transition. The state change still reads clearly from the
                    border and the live numbers around it.
                  */}
                  <span
                    className="text-small font-medium"
                    style={{ color: lit ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {stage.label}
                  </span>
                  <span className="text-tick text-text-tertiary">{stage.sub}</span>
                  <span className="text-tick tabular-nums text-text-secondary">{stageLiveNumber(stage, pipeline)}</span>
                </div>
                {index < STAGES.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden w-4 flex-shrink-0 items-center justify-center sm:flex"
                  >
                    <div className="h-px w-full" style={{ backgroundColor: 'var(--border-subtle)' }} />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </Figure>
  )
}
