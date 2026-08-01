import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Eyebrow } from '@/components/ui/Eyebrow'

export interface FigureProps {
  /** Mono uppercase kicker, e.g. "MEDIAN LIST PRICE". */
  eyebrow: string
  /** Sentence-case figure title. */
  title: string
  /** Optional one-line explanation shown under the title. */
  caption?: string
  /** REQUIRED. Rendered in the footer. There is no unsourced figure on this site. */
  source: string
  /** Reserved aspect ratio for the well, e.g. "4 / 3". Prevents CLS. */
  ratio: string
  /** Optional controls rendered in the well's top-right (segmented control etc.). */
  controls?: ReactNode
  /** The accessible equivalent. REQUIRED. Rendered inside <details>. */
  table: ReactNode
  /** The visual itself. */
  children: ReactNode
  className?: string
}

/**
 * The shared visualisation chrome. Every visual on the site is a child of this: it is chrome
 * and an accessibility contract only, and owns no scale, colour choice, data or interaction.
 */
export function Figure({ eyebrow, title, caption, source, ratio, controls, table, children, className }: FigureProps) {
  return (
    <figure className={clsx('not-prose', className)}>
      <div className="viz-figure-header">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h3 className="text-h3 mt-1 text-text-primary">{title}</h3>
          {caption && <p className="viz-caption">{caption}</p>}
        </div>
        {controls && <div>{controls}</div>}
      </div>
      <div className="viz-well" style={{ aspectRatio: ratio }}>
        {children}
      </div>
      <figcaption className="viz-footer">
        <span className="viz-source">{source}</span>
        <details className="viz-disclosure">
          <summary className="viz-disclosure-label">Show the numbers</summary>
          <div className="viz-table-wrap">{table}</div>
        </details>
      </figcaption>
    </figure>
  )
}
