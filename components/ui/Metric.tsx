import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface MetricProps {
  /** Rendered large. Pass a formatted string, or AnimatedNumber for a count-up variant. */
  value: ReactNode
  label: string
  /** Optional provenance note, e.g. the notebook cell or dataset a figure was pulled from. */
  source?: string
  className?: string
}

/** Large tabular figure, its label, and an optional source note. */
export function Metric({ value, label, source, className }: MetricProps) {
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <div className="text-metric text-text-primary">{value}</div>
      <div className="text-small text-text-secondary">{label}</div>
      {source && <div className="text-tick text-text-tertiary">{source}</div>}
    </div>
  )
}
