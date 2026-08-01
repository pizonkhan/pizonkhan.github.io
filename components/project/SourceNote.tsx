import clsx from 'clsx'

export interface SourceNoteProps {
  children: string
  className?: string
}

/** The "where this number came from" line. Every figure and headline number carries one. */
export function SourceNote({ children, className }: SourceNoteProps) {
  return <p className={clsx('text-tick text-text-tertiary', className)}>{children}</p>
}
