'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { DURATION, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { useRovingRadioGroup } from '@/lib/roving-radio'

type FillState = 'observed' | 'mean' | 'mice'

const STATE_OPTIONS: { value: FillState; label: string }[] = [
  { value: 'observed', label: 'Observed' },
  { value: 'mean', label: 'Mean fill' },
  { value: 'mice', label: 'MICE' },
]

/**
 * Hardcoded, illustrative bin counts for one distribution, 24 bins. No RNG, no seed, never
 * derived from the Zillow extract: this is the one figure on the page whose values are
 * synthetic, chosen only to demonstrate what a mean fill does to a distribution's shape versus
 * what MICE does. The dip at bin 6 is deliberate, so the silhouette reads as a real,
 * slightly irregular distribution rather than a drawn curve.
 */
const OBSERVED: readonly number[] = [
  4, 9, 15, 22, 28, 24, 8, 30, 33, 30, 26, 21, 16, 12, 9, 7, 5, 4, 3, 2, 2, 1, 1, 1,
]

/** Illustrative count of rows this feature was missing for. Roughly 31% of the observed total. */
const TOTAL_MISSING = 140

const OBSERVED_TOTAL = OBSERVED.reduce((sum, value) => sum + value, 0)

/** A mean fill: every missing row lands in the one bin nearest the distribution's weighted mean. */
const MEAN_BIN_INDEX = Math.round(
  OBSERVED.reduce((sum, value, index) => sum + value * index, 0) / OBSERVED_TOTAL,
)

const MEAN_FILL: readonly number[] = OBSERVED.map((value, index) =>
  index === MEAN_BIN_INDEX ? value + TOTAL_MISSING : value,
)

/** MICE: missing rows distributed in proportion to the observed shape, so the silhouette holds. */
const MICE_FILL: readonly number[] = (() => {
  const raw = OBSERVED.map((value) => (TOTAL_MISSING * value) / OBSERVED_TOTAL)
  const rounded = raw.map(Math.round)
  const shortfall = TOTAL_MISSING - rounded.reduce((sum, value) => sum + value, 0)
  // Any rounding remainder lands on the tallest bin; it is at most a few rows either way.
  const tallestIndex = rounded.indexOf(Math.max(...rounded))
  rounded[tallestIndex] += shortfall
  return OBSERVED.map((value, index) => value + rounded[index])
})()

const DISPLAY_MAX = Math.max(...OBSERVED, ...MICE_FILL) * 1.05
const CLIP_AT = Math.max(...OBSERVED, ...MICE_FILL) * 1.08

/**
 * The theory beat: one number cannot stand in for a distribution. Three states of the same 24
 * bins: what was actually observed, what a mean fill does to it (one spike, clipped and
 * annotated), and what MICE does to it (the silhouette holds). No axis carries a unit: nothing
 * here can be mistaken for a measurement off the Zillow extract.
 */
export function ImputationSpread() {
  const [state, setState] = useState<FillState>('observed')
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const [overshoot, setOvershoot] = useState(false)
  const prevState = useRef(state)
  useEffect(() => {
    if (prevState.current !== state) {
      prevState.current = state
      if (state === 'mean' && !reduced) {
        setOvershoot(true)
        const id = window.setTimeout(() => setOvershoot(false), DURATION.fast * 1000)
        return () => window.clearTimeout(id)
      }
    }
  }, [state, reduced])

  const values = state === 'observed' ? OBSERVED : state === 'mean' ? MEAN_FILL : MICE_FILL

  const tallest = useMemo(
    () => ({
      observed: Math.max(...OBSERVED),
      mean: Math.max(...MEAN_FILL),
      mice: Math.max(...MICE_FILL),
    }),
    [],
  )

  const tableRows = OBSERVED.map((value, index) => ({
    bin: String(index + 1),
    observed: String(value),
    mean: String(MEAN_FILL[index]),
    mice: String(MICE_FILL[index]),
  }))

  return (
    <Figure
      eyebrow="MISSING DATA"
      title="What a mean fill does to a distribution"
      caption="Same rows, same gaps, two ways of filling them."
      source="Illustrative. Synthetic values chosen to show the mechanism, not measurements from the Zillow extract."
      well={{ ratio: '16 / 9' }}
      controls={<StateControl value={state} onChange={setState} />}
      table={
        <div className="flex flex-col gap-4">
          <FigureTable
            caption="Row count per bin, in each fill state."
            columns={[
              { key: 'bin', label: 'Bin' },
              { key: 'observed', label: 'Observed', align: 'right' },
              { key: 'mean', label: 'Mean fill', align: 'right' },
              { key: 'mice', label: 'MICE', align: 'right' },
            ]}
            rows={tableRows}
          />
          <p className="text-small text-text-secondary">
            The tallest bin holds {tallest.observed} observed rows, {tallest.mean} after a mean fill and{' '}
            {tallest.mice} after MICE.
          </p>
        </div>
      }
    >
      <div ref={ref} className="flex h-full flex-col">
        {/*
          Observed and imputed are sibling, independently-positioned elements sharing one fixed
          scale (DISPLAY_MAX), not a nested stack. That is what lets the observed segment's
          height stay pixel-for-pixel constant across a state change: only the imputed sibling's
          own height and transition target move when `state` changes.
        */}
        <div className="flex flex-1 items-end gap-[2px] pt-8" aria-hidden="true">
          {values.map((value, index) => {
            const observedValue = OBSERVED[index]
            const isClippedBin = state === 'mean' && index === MEAN_BIN_INDEX
            const clippedTotal = isClippedBin ? Math.min(value, CLIP_AT) : value
            const observedHeightPct = (observedValue / DISPLAY_MAX) * 100
            const imputedHeightPct = Math.max(((clippedTotal - observedValue) / DISPLAY_MAX) * 100, 0)
            const delay = entered ? `${Math.min(index, 7) * 40}ms` : '0ms'

            return (
              <div key={index} className="relative h-full flex-1">
                {isClippedBin && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-tick text-text-primary">
                    &#9650; {value}
                  </span>
                )}
                <div
                  className="absolute inset-x-0"
                  style={{
                    bottom: entered ? `${observedHeightPct}%` : '0%',
                    height: entered ? `${imputedHeightPct}%` : '0%',
                    backgroundColor: 'var(--viz-seq-5)',
                    borderBottom: entered && imputedHeightPct > 0.01 ? '0.5px solid var(--viz-hairline)' : 'none',
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(11,12,14,0.22) 0, rgba(11,12,14,0.22) 1px, transparent 1px, transparent 6px)',
                    transform: overshoot && isClippedBin ? 'scaleY(1.04)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    transition: reduced
                      ? 'none'
                      : `height ${DURATION.base * 1000}ms var(--ease-in-out), bottom ${DURATION.draw * 1000}ms var(--ease-out) ${delay}, transform ${DURATION.fast * 1000}ms var(--ease-out)`,
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: entered ? `${observedHeightPct}%` : '0%',
                    backgroundColor: 'var(--text-tertiary)',
                    transition: reduced ? 'none' : `height ${DURATION.draw * 1000}ms var(--ease-out) ${delay}`,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border-strong pt-1.5 text-tick text-text-tertiary">
          <span>low</span>
          {state !== 'observed' && (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5"
                style={{
                  backgroundColor: 'var(--viz-seq-5)',
                  border: '0.5px solid var(--viz-hairline)',
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(11,12,14,0.22) 0, rgba(11,12,14,0.22) 1px, transparent 1px, transparent 6px)',
                }}
              />
              imputed
            </span>
          )}
          <span>high</span>
        </div>
      </div>
    </Figure>
  )
}

const STATE_VALUES = STATE_OPTIONS.map((option) => option.value)

function StateControl({ value, onChange }: { value: FillState; onChange: (v: FillState) => void }) {
  const { groupProps, getRadioProps } = useRovingRadioGroup(STATE_VALUES, value, onChange)

  return (
    <div role="radiogroup" aria-label="Fill method" className="flex gap-1" {...groupProps}>
      {STATE_OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            {...getRadioProps(option.value)}
            className={clsx(
              'rounded-sm border px-2.5 py-1 text-small transition-colors duration-(--dur-fast)',
              selected
                ? 'border-text-primary bg-text-primary text-surface-0'
                : 'border-border-strong bg-surface-1 text-text-secondary hover:bg-surface-2',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
