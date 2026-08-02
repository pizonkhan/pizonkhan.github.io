'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatUSD } from '@/lib/format'
import { IMPORTANCE_2025 } from '@/content/data/nyc-2025-models'

const MAX_INCREASE = Math.max(...IMPORTANCE_2025.map((row) => row.meanIncreaseMae))

const tableRows = IMPORTANCE_2025.map((row) => ({
  feature: row.label,
  meanIncreaseMae: formatUSD(row.meanIncreaseMae),
  std: `+/- ${formatUSD(row.std)}`,
}))

/**
 * Real permutation importance for the winning model, top 12, descending. Same shape as
 * ModelLadder2025's bars: one channel, the top bar in --text-primary, the rest --text-tertiary.
 */
export function ImportanceBars() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow="WHAT THE MODEL LEANS ON"
      title="Permutation importance, test set"
      caption="Each bar is how much worse the model gets when that one column is shuffled."
      source="Permutation importance over 10 repeats on the held-out test set, computed by scripts/train-nyc-sales-2025.py."
      well={{ height: 520, heightSm: 460 }}
      table={
        <FigureTable
          caption="Mean increase in test MAE, in dollars, when each feature is shuffled. Top 12."
          columns={[
            { key: 'feature', label: 'Feature' },
            { key: 'meanIncreaseMae', label: 'Mean increase', align: 'right' },
            { key: 'std', label: 'Std', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col justify-between py-1">
        {IMPORTANCE_2025.map((row, index) => {
          const isTop = index === 0
          const widthPct = (row.meanIncreaseMae / MAX_INCREASE) * 100
          const delay = `${Math.min(index, 7) * 40}ms`

          return (
            <div key={row.feature} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="order-1 w-[calc(100%-7rem)] truncate text-small text-text-primary sm:w-64 sm:flex-shrink-0 lg:w-72"
                title={row.label}
              >
                {row.label}
              </span>
              <span className="order-2 w-24 flex-shrink-0 text-right text-tick tabular-nums text-text-secondary sm:order-3 sm:w-28">
                {formatUSD(row.meanIncreaseMae)}
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
    </Figure>
  )
}
