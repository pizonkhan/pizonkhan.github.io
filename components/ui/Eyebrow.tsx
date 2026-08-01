import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface EyebrowProps {
  children: ReactNode
  className?: string
}

/** Mono uppercase label used above a heading or inside figure chrome. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span className={clsx('text-label text-text-tertiary', className)}>{children}</span>
  )
}
