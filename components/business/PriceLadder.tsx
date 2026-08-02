'use client'

import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { business } from '@/content/business'
import { formatUSD } from '@/lib/format'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'

export interface PriceLadderProps {
  className?: string
}

const { fare } = business.pricing
const MAX_AMOUNT = Math.max(...fare.rows.map((row) => row.amount))

const tableRows = [
  ...fare.rows.map((row) => ({ component: row.label, amount: formatUSD(row.amount) })),
  { component: fare.totalLabel, amount: formatUSD(fare.total) },
]

function barStyle(amount: number, index: number, entered: boolean, reduced: boolean): CSSProperties {
  return {
    width: `${(amount / MAX_AMOUNT) * 100}%`,
    height: '0.75rem',
    backgroundColor: 'var(--text-tertiary)',
    border: '0.5px solid var(--viz-hairline)',
    borderRadius: '2px',
    transformOrigin: 'left',
    transform: `scaleX(${entered ? 1 : 0})`,
    transition: reduced ? 'none' : `transform var(--dur-slow) var(--ease-out) ${index * 80}ms`,
  }
}

function totalStyle(entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? 'none' : 'translateY(6px)',
    transition: 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
    transitionDelay: '640ms',
  }
}

/**
 * The one Figure-wrapped visual on the page: a sample fare assembling itself from six labelled
 * components into one total. Bars are scaled to the largest component, not the total, so the
 * smallest one stays readable. content/business.ts marks these numbers illustrative; nothing
 * here is a live quote.
 */
export function PriceLadder({ className }: PriceLadderProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow={fare.figureEyebrow}
      title={fare.figureTitle}
      caption={fare.figureCaption}
      source={fare.figureSource}
      well={{ height: 400, heightSm: 300 }}
      table={
        <FigureTable
          caption={fare.tableCaption}
          columns={[
            { key: 'component', label: 'Component' },
            { key: 'amount', label: 'Amount', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
      className={className}
    >
      <div ref={ref} className="flex h-full flex-col justify-between py-1">
        <div className="flex flex-col gap-3">
          {fare.rows.map((row, index) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 sm:grid sm:grid-cols-[11rem_1fr_5rem] sm:items-center sm:gap-3"
            >
              <span className="text-body text-text-primary">{row.label}</span>
              <div className="flex items-center gap-3 sm:contents">
                <div className="relative h-3 w-full flex-1">
                  <div style={barStyle(row.amount, index, entered, reduced)} />
                </div>
                <span className="w-16 shrink-0 text-right text-small tabular-nums text-text-secondary sm:w-auto">
                  {formatUSD(row.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div aria-hidden style={{ height: '2px', backgroundColor: 'var(--accent)' }} />
          <div style={totalStyle(entered, reduced)}>
            <p className="text-metric text-text-primary">{formatUSD(fare.total)}</p>
            <p className="text-small text-text-secondary">{fare.totalLabel}</p>
          </div>
        </div>
      </div>
    </Figure>
  )
}
