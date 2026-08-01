'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatPercent, formatUSD } from '@/lib/format'
import { MODEL_LADDER } from '@/content/data/nyc-model-ladder'

const MAX_MAE = Math.max(...MODEL_LADDER.map((model) => model.mae))

const tableRows = MODEL_LADDER.map((model) => ({
  name: model.name,
  mae: formatUSD(model.mae),
  r2: model.r2 === null ? 'not recorded' : model.r2.toFixed(3),
  mape: model.mape === null ? 'not recorded' : formatPercent(model.mape),
}))

/**
 * The theory beat: every rung buys error reduction, and the last rung buys it from the target
 * transform rather than the algorithm. Deliberately monochrome: it charts one metric, and a
 * second hue would imply a second dimension that is not there. No colour carries the ranking;
 * every bar prints its own model name and MAE, and the winning bar additionally prints "best".
 */
export function ModelLadder() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow="MODEL LADDER"
      title="Eight rungs from the mean to XGBoost"
      caption="Every rung buys error. The last one buys it from the target transform, not the algorithm."
      source="Capstone notebook 04_Modeling.ipynb, printed test-set results."
      well={{ height: 420, heightSm: 360 }}
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
        {MODEL_LADDER.map((model, index) => {
          const isWinner = index === MODEL_LADDER.length - 1
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
