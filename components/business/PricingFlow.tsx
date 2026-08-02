'use client'

import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { business } from '@/content/business'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'

export interface PricingFlowProps {
  className?: string
}

const { flow } = business.pricing

const tableRows = flow.steps.map((step) => ({ step: step.title, detail: step.body }))

function cardStyle(index: number, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? 'none' : 'translateY(6px)',
    transition: 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
    transitionDelay: `${index * 160}ms`,
  }
}

// Vertical bar on mobile, horizontal on desktop via the sm:h-0.5 sm:w-full class swap. scaleY
// reads fine at both sizes since the bar is short enough that the reveal direction is barely
// perceptible, so one axis covers both breakpoints.
function connectorStyle(connectorIndex: number, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { transform: 'scaleY(1)', transitionDelay: '0ms' }
  return {
    transformOrigin: 'top',
    transform: entered ? 'scaleY(1)' : 'scaleY(0)',
    transition: 'transform var(--dur-base) var(--ease-out)',
    transitionDelay: `${(connectorIndex + 1) * 160 + 80}ms`,
  }
}

/**
 * The pricing configuration flow: portal edit, database write gated by row-level security, next
 * quote. Replaces the old sample-fare bar chart. No dollar figure or fee name appears anywhere
 * here or in its table equivalent, only the three-step path a rate change takes.
 */
export function PricingFlow({ className }: PricingFlowProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow={flow.figureEyebrow}
      title={flow.figureTitle}
      caption={flow.figureCaption}
      source={flow.figureSource}
      disclosureLabel="Show as text"
      well={{ height: 560, heightSm: 220 }}
      table={
        <FigureTable
          caption={flow.tableCaption}
          columns={[
            { key: 'step', label: 'Step' },
            { key: 'detail', label: 'What happens' },
          ]}
          rows={tableRows}
        />
      }
      className={className}
    >
      <div ref={ref} className="flex h-full flex-col justify-center gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {flow.steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 flex-col sm:flex-row sm:items-stretch">
            <div
              className="flex flex-1 flex-col gap-1 rounded-lg border border-border-subtle bg-surface-1 p-4"
              style={cardStyle(index, entered, reduced)}
            >
              <span className="text-tick text-text-tertiary">{`0${index + 1}`}</span>
              <span className="text-body font-medium text-text-primary">{step.title}</span>
              <span className="text-small text-text-secondary">{step.body}</span>
            </div>
            {index < flow.steps.length - 1 && (
              <div aria-hidden className="flex shrink-0 items-center justify-center py-2 sm:w-8 sm:py-0">
                <div
                  className="h-6 w-0.5 sm:h-0.5 sm:w-full"
                  style={{ backgroundColor: 'var(--accent)', ...connectorStyle(index, entered, reduced) }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </Figure>
  )
}
