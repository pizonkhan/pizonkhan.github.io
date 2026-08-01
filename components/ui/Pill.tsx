import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface PillProps {
  children: ReactNode
  /** 'neutral' for tags and skills, 'muted' for the planned-project state. */
  tone?: 'neutral' | 'muted'
  className?: string
}

/** Small status/tag chip. */
export function Pill({ children, tone = 'neutral', className }: PillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-3 py-1 text-small',
        tone === 'neutral' && 'border-border-subtle bg-surface-1 text-text-secondary',
        tone === 'muted' && 'border-border-subtle bg-surface-2 text-text-tertiary',
        className,
      )}
    >
      {children}
    </span>
  )
}
