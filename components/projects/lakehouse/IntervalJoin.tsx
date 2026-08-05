'use client'

import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { JOIN_RESOLUTION } from '@/content/data/lakehouse'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { INTERVAL_JOIN } from './lakehouse-geometry'
import { LayoutSvg, type LayoutElementId } from './LayoutSvg'

const SVG_LABEL =
  'Two version intervals on a time axis, with an event marked just before the boundary between them and an arrow reaching past it into the second interval.'

const RING_DELAY_MS = [1000, 1080]
const LABEL_DELAY_MS = [1000, 1080, 1150, 1300, 2400]
const ACCENT_TIMING: readonly { delayMs: number; duration: string }[] = [
  { delayMs: 1800, duration: 'var(--dur-base)' },
  { delayMs: 2040, duration: 'var(--dur-fast)' },
  { delayMs: 2160, duration: 'var(--dur-base)' },
]

const STRUCTURE_STAGGER_MS = 60
const DASHED_DELAY_MS = 900
const DOT_DELAY_MS = 1200
const ACCENT_DOT_DELAY_MS = 2400

const ROW_ONE_DELAY_MS = 1300
const ROW_TWO_DELAY_MS = 2450

function opacityStyle(delayMs: number, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transition: 'none' }
  return {
    opacity: entered ? 1 : 0,
    transition: 'opacity var(--dur-base) var(--ease-out)',
    transitionDelay: `${delayMs}ms`,
  }
}

/**
 * One styleFor per rendered layout, closed over that layout's own path lengths: the wide and
 * stacked geometries reveal the same beats at the same delays, but each path's true length
 * differs between the two, so the dash-offset math cannot be shared.
 */
function makeStyleFor(
  layout: typeof INTERVAL_JOIN.wide,
  entered: boolean,
  reduced: boolean,
): (id: LayoutElementId) => CSSProperties | undefined {
  return (id) => {
    const [kind, indexPart] = id.split(':')
    const index = Number(indexPart)

    switch (kind) {
      case 'structure': {
        const length = layout.structure[index]?.length ?? 0
        if (reduced) return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
        return {
          strokeDasharray: length,
          strokeDashoffset: entered ? 0 : length,
          transition: 'stroke-dashoffset var(--dur-draw) var(--ease-out)',
          transitionDelay: `${index * STRUCTURE_STAGGER_MS}ms`,
        }
      }
      case 'dashed':
        return opacityStyle(DASHED_DELAY_MS, entered, reduced)
      case 'ring':
        return opacityStyle(RING_DELAY_MS[index] ?? 0, entered, reduced)
      case 'dot':
        return opacityStyle(DOT_DELAY_MS, entered, reduced)
      case 'accent': {
        const length = layout.accent[index]?.length ?? 0
        if (reduced) return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
        const timing = ACCENT_TIMING[index]
        return {
          strokeDasharray: length,
          strokeDashoffset: entered ? 0 : length,
          transition: `stroke-dashoffset ${timing.duration} var(--ease-out)`,
          transitionDelay: `${timing.delayMs}ms`,
        }
      }
      case 'accentDot':
        return opacityStyle(ACCENT_DOT_DELAY_MS, entered, reduced)
      case 'label':
        return opacityStyle(LABEL_DELAY_MS[index] ?? 0, entered, reduced)
      default:
        return undefined
    }
  }
}

/**
 * Section figure for point-in-time: the half-open interval boundary that a whole-second
 * registration timestamp falls just short of, and the one-second widening that fixes it.
 */
export function IntervalJoin() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const wideStyleFor = makeStyleFor(INTERVAL_JOIN.wide, entered, reduced)
  const stackStyleFor = makeStyleFor(INTERVAL_JOIN.stack, entered, reduced)

  return (
    <Figure
      eyebrow="POINT IN TIME"
      title="The boundary that broke a join"
      caption="A registration timestamp rounded to the whole second falls just short of the version it created. Widening the lower bound by one second, the maximum possible truncation error, resolves it."
      source="Measured against the built tables. docs/04-model.md, the timestamp precision mismatch."
      disclosureLabel="Show the numbers"
      well={{ height: 400, heightSm: 340 }}
      table={
        <FigureTable
          caption="Registration rows resolved against dim_subscriber, before and after the fix."
          columns={[
            { key: 'predicate', label: 'Predicate' },
            { key: 'rows', label: 'Rows resolved', align: 'right' },
          ]}
          rows={[
            { predicate: JOIN_RESOLUTION.literalLabel, rows: JOIN_RESOLUTION.literalValue },
            { predicate: JOIN_RESOLUTION.widenedLabel, rows: JOIN_RESOLUTION.widenedValue },
          ]}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-2">
        <div className="mx-auto h-full min-h-0 w-full max-w-[320px] flex-1 sm:max-w-[700px]">
          <div className="hidden h-full sm:block">
            <LayoutSvg layout={INTERVAL_JOIN.wide} title={SVG_LABEL} styleFor={wideStyleFor} />
          </div>
          <div className="h-full sm:hidden">
            <LayoutSvg layout={INTERVAL_JOIN.stack} title={SVG_LABEL} styleFor={stackStyleFor} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div
            className="flex items-baseline justify-between gap-3 border-l-2 pl-2"
            style={{ borderColor: 'transparent', ...opacityStyle(ROW_ONE_DELAY_MS, entered, reduced) }}
          >
            <span className="text-tick text-text-tertiary">{JOIN_RESOLUTION.literalLabel}</span>
            <span className="text-small tabular-nums text-text-primary">{JOIN_RESOLUTION.literalValue}</span>
          </div>
          <div
            className="flex items-baseline justify-between gap-3 border-l-2 pl-2"
            style={{ borderColor: 'var(--accent)', ...opacityStyle(ROW_TWO_DELAY_MS, entered, reduced) }}
          >
            <span className="text-tick text-text-tertiary">{JOIN_RESOLUTION.widenedLabel}</span>
            <span className="text-small tabular-nums text-text-primary">{JOIN_RESOLUTION.widenedValue}</span>
          </div>
        </div>
      </div>
    </Figure>
  )
}
