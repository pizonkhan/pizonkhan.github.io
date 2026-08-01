import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface ProseProps {
  children: ReactNode
  className?: string
}

/** Long-form serif wrapper, held to the 68ch prose measure. */
export function Prose({ children, className }: ProseProps) {
  return (
    <div className={clsx('max-w-(--measure-prose) text-prose text-text-secondary [&_p+p]:mt-4', className)}>
      {children}
    </div>
  )
}
