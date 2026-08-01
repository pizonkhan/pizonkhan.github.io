import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface ContainerProps {
  /** 'content' is the default page width, 'narrow' for text-heavy sections, 'prose' for the 68ch measure. */
  width?: 'content' | 'narrow' | 'prose'
  children: ReactNode
  className?: string
}

const WIDTH_STYLE: Record<NonNullable<ContainerProps['width']>, string> = {
  content: 'max-w-(--width-content)',
  narrow: 'max-w-(--width-narrow)',
  prose: 'max-w-(--measure-prose)',
}

/** The one width constraint every section content block goes through. */
export function Container({ width = 'content', children, className }: ContainerProps) {
  return (
    <div className={clsx('mx-auto w-full px-6 sm:px-8', WIDTH_STYLE[width], className)}>
      {children}
    </div>
  )
}
