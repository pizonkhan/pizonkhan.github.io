'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { useRovingRadioGroup } from '@/lib/roving-radio'

export type Mechanism = 'linear' | 'neighbours' | 'forest' | 'boosting'

export interface ModelMechanismsProps {
  initialMechanism?: Mechanism // default 'linear'
}

/**
 * The synthetic scatter every mechanism draws over. 60 points, feature on x (0..100, no unit),
 * target on y (0..100, no unit). Hardcoded once here: no RNG at runtime, no fitting in the
 * browser, so every visitor and every screenshot sees the same figure.
 */
const POINTS: readonly [number, number][] = [
  [4, 22.48], [5.56, 30.16], [7.12, 31.87], [8.68, 26.45], [10.24, 17.82], [11.8, 12.14],
  [13.36, 13.3], [14.92, 20.14], [16.47, 27.44], [18.03, 30], [19.59, 26.62], [21.15, 21],
  [22.71, 18.91], [24.27, 23.68], [25.83, 33.57], [27.39, 42.93], [28.95, 46.31], [30.51, 42.49],
  [32.07, 35.28], [33.63, 30.66], [35.19, 32.25], [36.75, 38.66], [38.31, 44.66], [39.86, 45.32],
  [41.42, 39.84], [42.98, 32.34], [44.54, 28.83], [46.1, 32.7], [47.66, 42.19], [49.22, 51.61],
  [50.78, 55.61], [52.34, 53.03], [53.9, 47.64], [55.46, 45.16], [57.02, 48.79], [58.58, 56.71],
  [60.14, 63.42], [61.69, 63.97], [63.25, 57.75], [64.81, 49.09], [66.37, 44.15], [67.93, 46.37],
  [69.49, 54.06], [71.05, 61.73], [72.61, 64.33], [74.17, 61.05], [75.73, 55.9], [77.29, 54.53],
  [78.85, 59.86], [80.41, 69.67], [81.97, 78.17], [83.53, 80.25], [85.08, 75.24], [86.64, 67.44],
  [88.2, 62.86], [89.76, 64.77], [91.32, 71.35], [92.88, 77.22], [94.44, 77.65], [96, 72.31],
]

/** OLS fit over POINTS, and a heavily penalised fit pulled toward the mean, both precomputed. */
const OLS = { slope: 0.6155, intercept: 15.586 }
const PENALISED = { slope: 0.2154, intercept: 35.591 }

/** The cursor's five nearest neighbours, at feature = 52, and their mean. Indices into POINTS. */
const NEIGHBOUR_CURSOR_X = 52
const NEIGHBOUR_INDICES = [29, 30, 31, 32, 33] as const
const NEIGHBOUR_MEAN_Y = 50.61

type Step = readonly [number, number, number] // [from, to, value]

const FOREST_TREES: readonly Step[][] = [
  [[0, 18, 22.42], [18, 40, 34.16], [40, 62, 47.27], [62, 82, 58.2], [82, 100, 72.12]],
  [[0, 14, 22.03], [14, 33, 30.7], [33, 50, 38.1], [50, 68, 52.64], [68, 88, 65.19], [88, 100, 71.03]],
  [[0, 25, 23], [25, 55, 40.84], [55, 78, 55.13], [78, 100, 71.4]],
]
const FOREST_AVERAGE: readonly Step[] = [
  [0, 14, 22.48], [14, 18, 25.37], [18, 25, 29.29], [25, 33, 35.23], [33, 40, 37.7],
  [40, 50, 42.07], [50, 55, 46.92], [55, 62, 51.68], [62, 68, 55.32], [68, 78, 59.51],
  [78, 82, 64.93], [82, 88, 69.57], [88, 100, 71.52],
]

const BOOSTING_STAGES: readonly { steps: readonly Step[]; mae: number }[] = [
  { steps: [[0, 46, 30.19], [46, 100, 59.59]], mae: 8.73 },
  { steps: [[0, 30, 26.17], [30, 46, 28.51], [46, 65, 57.91], [65, 100, 64.95]], mae: 8.05 },
  {
    steps: [
      [0, 20, 23.49], [20, 30, 33.33], [30, 45, 35.67], [45, 46, 20.05],
      [46, 65, 49.45], [65, 70, 56.49], [70, 100, 67.9],
    ],
    mae: 6.72,
  },
]

const MECHANISM_OPTIONS: readonly { value: Mechanism; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'neighbours', label: 'Neighbours' },
  { value: 'forest', label: 'Forest' },
  { value: 'boosting', label: 'Boosting' },
]

const IDEA: Record<Mechanism, string> = {
  linear: 'A straight line, and a penalty that pulls its slope toward zero.',
  neighbours: 'The prediction is an average of the closest examples, so it is bumpy and cannot extrapolate.',
  forest: 'Each tree is a set of splits; averaging many of them smooths the steps out.',
  boosting: 'Each new tree fits what the last one got wrong.',
}

function y(value: number): number {
  return 100 - value
}

function stepPath(steps: readonly Step[]): string {
  return steps
    .map(([from, to, value], index) => `${index === 0 ? 'M' : 'L'} ${from} ${y(value)} L ${to} ${y(value)}`)
    .join(' ')
}

const tableRows = POINTS.map(([x, target], index) => ({
  index: String(index + 1),
  feature: x.toFixed(1),
  target: target.toFixed(1),
}))

/**
 * One synthetic scatter, four mechanisms drawn over it. No real metric appears here: axes carry
 * no unit and no dollar sign, so nothing can be misread as a measurement from the 2025 sales.
 */
export function ModelMechanisms({ initialMechanism = 'linear' }: ModelMechanismsProps) {
  const [mechanism, setMechanism] = useState<Mechanism>(initialMechanism)
  const [boostStage, setBoostStage] = useState(0)
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const { groupProps: mechanismGroupProps, getRadioProps: getMechanismRadioProps } = useRovingRadioGroup(
    MECHANISM_OPTIONS.map((option) => option.value),
    mechanism,
    (next) => {
      setMechanism(next)
      setBoostStage(0)
    },
  )

  const stageValues = ['0', '1', '2'] as const
  const { groupProps: stageGroupProps, getRadioProps: getStageRadioProps } = useRovingRadioGroup(
    stageValues,
    String(boostStage) as (typeof stageValues)[number],
    (next) => setBoostStage(Number(next)),
  )

  return (
    <Figure
      eyebrow="FOUR MECHANISMS"
      title="How each model actually fits"
      caption="Same synthetic points every time. Only the fitting rule changes."
      source="Illustrative. Synthetic values chosen to show each mechanism, not measurements from the sales data."
      well={{ ratio: '4 / 3', ratioSm: '16 / 9' }}
      controls={
        <div role="radiogroup" aria-label="Mechanism" className="flex gap-1" {...mechanismGroupProps}>
          {MECHANISM_OPTIONS.map((option) => {
            const selected = option.value === mechanism
            return (
              <button
                key={option.value}
                type="button"
                {...getMechanismRadioProps(option.value)}
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
      }
      table={
        <div className="flex flex-col gap-4">
          <FigureTable
            caption="All 60 synthetic points behind this figure."
            columns={[
              { key: 'index', label: '#' },
              { key: 'feature', label: 'feature', align: 'right' },
              { key: 'target', label: 'target', align: 'right' },
            ]}
            rows={tableRows}
          />
          <p className="text-small text-text-secondary">{IDEA[mechanism]}</p>
          {mechanism === 'linear' && (
            <p className="text-small text-text-secondary">
              Least squares slope {OLS.slope.toFixed(2)}, penalised slope {PENALISED.slope.toFixed(2)}.
              Both fitted over the 60 synthetic points above, with no unit attached.
            </p>
          )}
        </div>
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-2">
        <div className="flex min-h-0 flex-1 gap-1.5">
          <span className="[writing-mode:vertical-rl] rotate-180 self-center text-tick text-text-tertiary">
            target
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <svg viewBox="-4 -4 108 116" className="w-full flex-1" role="presentation" aria-hidden="true">
              {POINTS.map(([x, target], index) => (
                <circle
                  key={index}
                  cx={x}
                  cy={y(target)}
                  r={1.4}
                  fill="var(--text-tertiary)"
                  opacity={entered ? 1 : 0}
                  style={{
                    transition: reduced ? 'none' : `opacity 480ms var(--ease-out) ${Math.min(index, 8) * 40}ms`,
                  }}
                />
              ))}

              {mechanism === 'linear' && (
                <g style={{ transition: reduced ? 'none' : 'opacity 240ms var(--ease-in-out)' }}>
                  <line
                    x1={0} y1={y(OLS.intercept)} x2={100} y2={y(OLS.intercept + OLS.slope * 100)}
                    stroke="var(--text-primary)" strokeWidth={1.2}
                  />
                  <line
                    x1={0} y1={y(PENALISED.intercept)} x2={100} y2={y(PENALISED.intercept + PENALISED.slope * 100)}
                    stroke="var(--viz-cat-6)" strokeWidth={1.2} strokeDasharray="3 2"
                  />
                </g>
              )}

              {mechanism === 'neighbours' && (
                <g>
                  <line x1={NEIGHBOUR_CURSOR_X} y1={0} x2={NEIGHBOUR_CURSOR_X} y2={100} stroke="var(--text-primary)" strokeWidth={0.6} strokeDasharray="2 2" />
                  <line x1={NEIGHBOUR_CURSOR_X - 5} y1={y(NEIGHBOUR_MEAN_Y)} x2={NEIGHBOUR_CURSOR_X + 5} y2={y(NEIGHBOUR_MEAN_Y)} stroke="var(--text-primary)" strokeWidth={1.4} />
                  {NEIGHBOUR_INDICES.map((index) => (
                    <circle
                      key={index}
                      cx={POINTS[index][0]}
                      cy={y(POINTS[index][1])}
                      r={3}
                      fill="none"
                      stroke="var(--text-primary)"
                      strokeWidth={1.2}
                    />
                  ))}
                </g>
              )}

              {mechanism === 'forest' && (
                <g>
                  {FOREST_TREES.map((tree, treeIndex) => (
                    <path key={treeIndex} d={stepPath(tree)} fill="none" stroke="var(--viz-cat-6)" strokeWidth={0.8} strokeDasharray="2 2" opacity={0.7} />
                  ))}
                  <path d={stepPath(FOREST_AVERAGE)} fill="none" stroke="var(--text-primary)" strokeWidth={1.4} />
                </g>
              )}

              {mechanism === 'boosting' && (
                <path d={stepPath(BOOSTING_STAGES[boostStage].steps)} fill="none" stroke="var(--text-primary)" strokeWidth={1.4} />
              )}
            </svg>

            <div className="flex items-end justify-between text-tick text-text-tertiary">
              <span>low</span>
              <span>feature</span>
              <span>high</span>
            </div>
          </div>
        </div>

        {mechanism === 'linear' && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-tick text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <svg width="18" height="2" aria-hidden="true">
                <line x1="0" y1="1" x2="18" y2="1" stroke="var(--text-primary)" strokeWidth="2" />
              </svg>
              Least squares, slope {OLS.slope.toFixed(2)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="18" height="2" aria-hidden="true">
                <line x1="0" y1="1" x2="18" y2="1" stroke="var(--viz-cat-6)" strokeWidth="2" strokeDasharray="3 2" />
              </svg>
              Penalised, slope {PENALISED.slope.toFixed(2)}, the dashed line
            </span>
          </div>
        )}

        {mechanism === 'boosting' && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div role="radiogroup" aria-label="Boosting stage" className="flex gap-1" {...stageGroupProps}>
              {stageValues.map((value, index) => {
                const selected = String(boostStage) === value
                return (
                  <button
                    key={value}
                    type="button"
                    {...getStageRadioProps(value)}
                    className={clsx(
                      'rounded-sm border px-2.5 py-1 text-small transition-colors duration-(--dur-fast)',
                      selected
                        ? 'border-text-primary bg-text-primary text-surface-0'
                        : 'border-border-strong bg-surface-1 text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    {`Stage ${index + 1}`}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 text-tick text-text-tertiary">
              <span>Residual</span>
              <div className="flex h-3 items-end gap-1">
                {BOOSTING_STAGES.map((stage, index) => (
                  <div
                    key={index}
                    className="w-3"
                    style={{
                      height: `${(stage.mae / BOOSTING_STAGES[0].mae) * 100}%`,
                      backgroundColor: index === boostStage ? 'var(--text-primary)' : 'var(--viz-seq-5)',
                      transition: reduced ? 'none' : 'height 240ms var(--ease-in-out)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Figure>
  )
}
