'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatCount, formatPercent } from '@/lib/format'
import { SEQ } from '@/lib/viz/palette'
import type { BucketRow, MedianKind } from '@/lib/analytics/stats-types'

export interface DwellHistogramProps {
  buckets: BucketRow[]
  medianKind: MedianKind
}

const EDGE_LABEL = ['<5s', '5-15s', '15-30s', '30-60s', '1-2m', '2-5m', '>=5m']

/**
 * Seven vertical bars, always seven. The SEQ ramp fill is decoration: every bar already prints
 * its own count and edge label, so the ramp encodes nothing a screen reader or a colorblind
 * visitor would miss.
 */
export function DwellHistogram({ buckets, medianKind }: DwellHistogramProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const total = buckets.reduce((sum, bucket) => sum + bucket.n, 0)
  const maxN = Math.max(1, ...buckets.map((bucket) => bucket.n))

  const tableRows = buckets.map((bucket) => ({
    range: EDGE_LABEL[bucket.bucket] ?? String(bucket.bucket),
    n: formatCount(bucket.n),
    share: total > 0 ? formatPercent(bucket.n / total) : '0.0%',
  }))

  const caption =
    medianKind === 'estimated'
      ? 'Seven buckets of visible seconds on page. The all-time median is estimated from this histogram.'
      : 'Seven buckets of visible seconds on page for this window.'

  return (
    <Figure
      eyebrow="TIME ON PAGE"
      title="How long people actually stay"
      caption={caption}
      source="This site's own duration readings, read live from the analytics worker."
      well={{ height: 300, heightSm: 320 }}
      table={
        <FigureTable
          caption="Every bucket's reading count and share of all readings in this window."
          columns={[
            { key: 'range', label: 'Time on page' },
            { key: 'n', label: 'Readings', align: 'right' },
            { key: 'share', label: 'Share', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div
        ref={ref}
        className="flex h-full items-end gap-2 px-1"
        role="img"
        aria-label={`Time on page distribution over ${formatCount(total)} readings.`}
      >
        {buckets.map((bucket, index) => {
          const heightPct = (bucket.n / maxN) * 100
          const delay = `${index * 40}ms`
          return (
            <div key={bucket.bucket} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-tick tabular-nums text-text-secondary">{formatCount(bucket.n)}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[2px]"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: SEQ[index] ?? SEQ[SEQ.length - 1],
                    border: '0.5px solid var(--viz-hairline)',
                    transformOrigin: 'bottom',
                    transform: `scaleY(${entered ? 1 : 0})`,
                    transition: reduced ? 'none' : `transform 900ms var(--ease-out) ${delay}`,
                  }}
                />
              </div>
              <span className="text-tick text-text-tertiary">{EDGE_LABEL[index]}</span>
            </div>
          )
        })}
      </div>
    </Figure>
  )
}
