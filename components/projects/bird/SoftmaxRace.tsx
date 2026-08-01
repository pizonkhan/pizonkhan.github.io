'use client'

import { useEffect, useState } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { DURATION, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatPercent } from '@/lib/format'
import { useBirdAsset } from './useBirdAsset'

interface SoftmaxEntry {
  label: string
  probability: number
}

/**
 * The theory beat: 4,096 numbers become one bird. A bar race over the real top-8 ImageNet
 * probabilities from the same forward pass that produced the activation sprites. The source
 * data already arrives sorted by probability, so growth needs no reordering step at runtime;
 * the settle pulse marks the winner the softmax layer actually committed to.
 */
export function SoftmaxRace() {
  const asset = useBirdAsset<SoftmaxEntry[]>('softmax-top8.json')
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered
  const [pulsed, setPulsed] = useState(false)

  useEffect(() => {
    if (reduced || !entered) return
    const pulseId = window.setTimeout(() => setPulsed(true), DURATION.sequence * 1000)
    // The pulse is one shot: scale(1) -> 1.02 -> back to 1 over 240ms, not a permanent
    // distortion of a mark that encodes a probability.
    const releaseId = window.setTimeout(() => setPulsed(false), DURATION.sequence * 1000 + 240)
    return () => {
      window.clearTimeout(pulseId)
      window.clearTimeout(releaseId)
    }
  }, [entered, reduced])

  const maxProbability = asset.status === 'ready' ? Math.max(...asset.data.map((e) => e.probability)) : 1

  const tableRows =
    asset.status === 'ready'
      ? asset.data.map((entry, index) => ({
          rank: String(index + 1),
          label: entry.label,
          probability: formatPercent(entry.probability, { digits: 4 }),
        }))
      : []

  return (
    <Figure
      eyebrow="SOFTMAX"
      title="4,096 numbers become one bird"
      caption="The real top-8 probabilities from a stock ImageNet VGG16 forward pass on the source photo."
      source="Same forward pass as the activation strips above; softmax over 1,000 ImageNet classes."
      well={{ height: 480, heightSm: 360 }}
      table={
        asset.status === 'ready' ? (
          <FigureTable
            caption="The eight most probable ImageNet classes for the source photo, softmax output."
            columns={[
              { key: 'rank', label: 'Rank' },
              { key: 'label', label: 'Class' },
              { key: 'probability', label: 'Probability', align: 'right' },
            ]}
            rows={tableRows}
          />
        ) : (
          <p className="text-small text-text-secondary">Loading the underlying figures.</p>
        )
      }
    >
      {asset.status === 'loading' && (
        <p className="flex h-full items-center justify-center text-tick text-text-tertiary">
          Loading the softmax output.
        </p>
      )}
      {asset.status === 'error' && (
        <p className="flex h-full items-center justify-center text-tick text-text-tertiary">
          Could not load the softmax output.
        </p>
      )}
      {asset.status === 'ready' && (
        <div ref={ref} className="flex h-full flex-col justify-between py-1">
          {asset.data.map((entry, index) => {
            const isWinner = index === 0
            const widthPct = (entry.probability / maxProbability) * 100

            return (
              <div key={entry.label} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span
                  className="order-1 w-[calc(100%-6rem)] truncate text-small text-text-primary sm:w-32"
                  title={entry.label}
                >
                  {entry.label}
                </span>
                <span className="order-2 w-24 flex-shrink-0 text-right text-tick tabular-nums text-text-secondary sm:order-3">
                  {formatPercent(entry.probability, { digits: entry.probability < 0.01 ? 4 : 2 })}
                </span>
                <div className="relative order-3 h-4 w-full sm:order-2 sm:w-auto sm:flex-1">
                  <div
                    className="h-full min-w-[2px] origin-left rounded-[2px]"
                    style={{
                      width: entered ? `${widthPct}%` : '0%',
                      backgroundColor: isWinner ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      border: '0.5px solid var(--viz-hairline)',
                      transform: `scale(${isWinner && pulsed ? 1.02 : 1})`,
                      transition: reduced
                        ? 'none'
                        : `width ${DURATION.sequence * 1000}ms var(--ease-out), transform 240ms var(--ease-in-out)`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Figure>
  )
}
