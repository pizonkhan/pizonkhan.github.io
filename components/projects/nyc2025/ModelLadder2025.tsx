'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatPercent, formatUSD } from '@/lib/format'
import { MODELS_2025, WINNER } from '@/content/data/nyc-2025-models'

const MAX_MAE = Math.max(...MODELS_2025.map((model) => model.mae))
const BASELINE_MAE = MODELS_2025[0].mae
const SAVED_FROM_FLOOR = formatUSD(BASELINE_MAE - WINNER.mae)

const CAPTION = `The floor is predicting the citywide median for every sale. ${WINNER.name} takes ${SAVED_FROM_FLOOR} off it.`

const tableRows = MODELS_2025.map((model) => ({
  name: model.name,
  mae: formatUSD(model.mae),
  r2: model.r2.toFixed(3),
  mape: formatPercent(model.mape),
}))

/**
 * The real error ladder, trained on the same 2025 sales the map draws. Deliberately monochrome
 * for the reason the 2019 ModelLadder is monochrome: one metric, one channel. No colour carries
 * the ranking; every bar prints its own model name and MAE, and the winning bar additionally
 * prints "best".
 */
export function ModelLadder2025() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow="MODEL LADDER, 2025 DATA"
      title="Every rung, scored the same way"
      caption={CAPTION}
      source="Computed by scripts/train-nyc-sales-2025.py on the same 2025 sales the map draws."
      well={{ height: 380, heightSm: 340 }}
      table={
        <FigureTable
          caption="Test-set error for every model in the ladder, worst to best."
          columns={[
            { key: 'name', label: 'Model' },
            { key: 'mae', label: 'Test MAE', align: 'right' },
            { key: 'r2', label: 'Test R²', align: 'right' },
            { key: 'mape', label: 'MAPE', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col justify-between py-1">
        {MODELS_2025.map((model, index) => {
          const isWinner = model === WINNER
          const widthPct = (model.mae / MAX_MAE) * 100
          const delay = `${Math.min(index, 7) * 40}ms`

          return (
            <div key={model.name} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="order-1 w-[calc(100%-7rem)] truncate text-small text-text-primary sm:w-64 sm:flex-shrink-0 lg:w-72"
                title={model.name}
              >
                {model.name}
              </span>
              <span className="order-2 w-24 flex-shrink-0 text-right text-tick tabular-nums text-text-secondary sm:order-3 sm:w-28">
                {formatUSD(model.mae)}
                {isWinner && <span className="ml-1.5 text-text-primary">best</span>}
              </span>
              <div className="relative order-3 h-4 w-full sm:order-2 sm:w-auto sm:flex-1">
                <div
                  className="h-full origin-left rounded-[2px]"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: isWinner ? 'var(--text-primary)' : 'var(--text-tertiary)',
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
