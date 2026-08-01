'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatUSD } from '@/lib/format'
import { BOROUGHS } from '@/content/data/nyc-boroughs'

const SCALE_MIN = 100_000
const SCALE_MAX = 10_000_000

/** Shared log scale, $100K to $10M: the wrangling bounds the write-up itself uses. */
function logPercent(value: number): number {
  const min = Math.log10(SCALE_MIN)
  const max = Math.log10(SCALE_MAX)
  return ((Math.log10(value) - min) / (max - min)) * 100
}

const ORDERED = [...BOROUGHS].sort((a, b) => b.median - a.median)

const tableRows = ORDERED.map((borough) => ({
  borough: borough.name,
  p10: formatUSD(borough.deciles[0]),
  p30: formatUSD(borough.deciles[2]),
  p50: formatUSD(borough.median),
  p70: formatUSD(borough.deciles[6]),
  p90: formatUSD(borough.deciles[8]),
}))

/**
 * The theory beat: location dominates. Five boroughs, five decile bands on a shared log scale,
 * and Manhattan's spread alone runs past four times Brooklyn's. Chrome's one hue is withheld
 * from every mark here: thickness and containment tell whisker, band and median tick apart
 * before colour does, and every one of them is also labelled directly in text.
 */
export function BoroughSpread() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow="LIST PRICE BY BOROUGH"
      title="Five boroughs, five distributions"
      caption="Manhattan's spread is the story: its p90 is over 4× Brooklyn's."
      source="Zillow 2019 NYC extract, 59,350 cleaned listings."
      well={{ ratio: '16 / 9' }}
      table={
        <FigureTable
          caption="Price deciles by borough, log-scaled from $100,000 to $10,000,000."
          columns={[
            { key: 'borough', label: 'Borough' },
            { key: 'p10', label: 'P10', align: 'right' },
            { key: 'p30', label: 'P30', align: 'right' },
            { key: 'p50', label: 'P50 (median)', align: 'right' },
            { key: 'p70', label: 'P70', align: 'right' },
            { key: 'p90', label: 'P90', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col justify-between py-1">
        {ORDERED.map((borough, index) => {
          const isManhattan = borough.name === 'Manhattan'
          const p10 = logPercent(borough.deciles[0])
          const p30 = logPercent(borough.deciles[2])
          const p50 = logPercent(borough.median)
          const p70 = logPercent(borough.deciles[6])
          const p90 = logPercent(borough.deciles[8])
          const delay = `${index * 40}ms`

          return (
            <div key={borough.name} className="flex items-center gap-3">
              <span className="w-24 flex-shrink-0 text-small text-text-primary">{borough.name}</span>
              <div className="relative h-6 flex-1">
                {/* Whisker: p10 to p90, drawn left to right on first view. */}
                <div
                  className="absolute top-1/2 h-[2px] -translate-y-1/2"
                  style={{
                    left: `${p10}%`,
                    width: `${p90 - p10}%`,
                    backgroundColor: 'var(--text-tertiary)',
                    transformOrigin: 'left center',
                    transform: `translateY(-50%) scaleX(${entered ? 1 : 0})`,
                    transition: reduced ? 'none' : `transform 480ms var(--ease-out) ${delay}`,
                  }}
                >
                  <span
                    className="absolute left-0 top-1/2 h-2 w-[2px] -translate-x-1/2 -translate-y-1/2"
                    style={{ backgroundColor: 'var(--text-tertiary)' }}
                  />
                  <span
                    className="absolute right-0 top-1/2 h-2 w-[2px] translate-x-1/2 -translate-y-1/2"
                    style={{ backgroundColor: 'var(--text-tertiary)' }}
                  />
                </div>

                {/* Band: p30 to p70, fading in after the whisker draws. */}
                <div
                  className="absolute top-1/2 h-3.5 -translate-y-1/2 rounded-sm"
                  style={{
                    left: `${p30}%`,
                    width: `${p70 - p30}%`,
                    backgroundColor: 'var(--viz-cat-6)',
                    border: '0.5px solid var(--viz-hairline)',
                    opacity: entered ? 1 : 0,
                    transition: reduced ? 'none' : `opacity 120ms var(--ease-out) calc(480ms + ${delay})`,
                  }}
                />

                {/* Median tick: p50, overhanging the band. */}
                <div
                  className="absolute top-1/2 h-[22px] w-[2px] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${p50}%`,
                    backgroundColor: 'var(--text-primary)',
                    opacity: entered ? 1 : 0,
                    transition: reduced ? 'none' : `opacity 120ms var(--ease-out) calc(480ms + ${delay})`,
                  }}
                />

                {isManhattan && (
                  <>
                    <span className="absolute -bottom-4 text-tick text-text-tertiary" style={{ left: `${p10}%`, transform: 'translateX(-50%)' }}>
                      p10
                    </span>
                    <span className="absolute -bottom-4 text-tick text-text-tertiary" style={{ left: `${p90}%`, transform: 'translateX(-50%)' }}>
                      p90
                    </span>
                    <span className="absolute -top-4 text-tick text-text-tertiary" style={{ left: `${(p30 + p70) / 2}%`, transform: 'translateX(-50%)' }}>
                      p30 to p70
                    </span>
                  </>
                )}
              </div>
              <span className="w-28 flex-shrink-0 text-right text-tick text-text-secondary tabular-nums">
                {formatUSD(borough.median)}
              </span>
            </div>
          )
        })}
      </div>
    </Figure>
  )
}
