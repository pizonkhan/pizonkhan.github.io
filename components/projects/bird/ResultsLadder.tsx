'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatPercent } from '@/lib/format'
import { BIRD_MODEL_LADDER } from '@/content/data/bird-model-ladder'

const MAX_ACCURACY = Math.max(...BIRD_MODEL_LADDER.map((model) => model.accuracy))
const CHANCE = 1 / 315

const tableRows = BIRD_MODEL_LADDER.map((model) => ({
  name: model.name,
  accuracy: formatPercent(model.accuracy, { digits: 3 }),
  source: model.source,
  note: model.note ?? '',
}))

/**
 * The centrepiece, the overview and the result before any theory: eight real checkpoints,
 * in the order they were actually run, from a network that has never seen an edge to the
 * fine-tuned VGG16 backbone. The first bar is marked as the chance floor, 1 in 315, so the
 * distance every later bar buys is never something the reader has to work out for themselves.
 */
export function ResultsLadder() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow="EIGHT CHECKPOINTS"
      title="From chance to 97.651%"
      caption="Every rung is a real checkpoint from the notebooks, in the order it was actually run."
      source="Capstone 3 notebooks 01 and 02, printed evaluation cells."
      well={{ height: 500, heightSm: 360 }}
      table={
        <div className="flex flex-col gap-4">
          <FigureTable
            caption="Top-1 accuracy for every checkpoint, in run order, with its notebook citation."
            columns={[
              { key: 'name', label: 'Checkpoint' },
              { key: 'accuracy', label: 'Top-1 accuracy', align: 'right' },
              { key: 'source', label: 'Source' },
              { key: 'note', label: 'Note' },
            ]}
            rows={tableRows}
          />
          <p className="text-small text-text-secondary">
            Exact chance across 315 species is {formatPercent(CHANCE, { digits: 3 })}. The dense-only network
            landed there exactly; the final model is {formatPercent(MAX_ACCURACY, { digits: 3 })}.
          </p>
        </div>
      }
    >
      <div ref={ref} className="flex h-full flex-col justify-between py-1">
        {BIRD_MODEL_LADDER.map((model, index) => {
          const isChance = index === 0
          const isWinner = index === BIRD_MODEL_LADDER.length - 1
          const widthPct = (model.accuracy / MAX_ACCURACY) * 100
          const delay = `${Math.min(index, 7) * 40}ms`

          return (
            <div key={model.name} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="order-1 w-[calc(100%-7rem)] truncate text-small text-text-primary sm:w-72 sm:flex-shrink-0 lg:w-80"
                title={model.name}
              >
                {model.name}
              </span>
              <span className="order-2 w-28 flex-shrink-0 text-right text-tick tabular-nums text-text-secondary sm:order-3 sm:w-44">
                {formatPercent(model.accuracy, { digits: 3 })}
                {isChance && <span className="ml-1.5 text-text-primary">chance, 1 in 315</span>}
                {isWinner && <span className="ml-1.5 text-text-primary">final model</span>}
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
                {isChance && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0"
                    style={{ left: `${widthPct}%`, borderLeft: '1px dashed var(--border-strong)' }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Figure>
  )
}
