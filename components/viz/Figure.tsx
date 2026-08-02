import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { wellStyle, type WellSize } from '@/lib/viz/well'

export interface FigureProps {
  /** Mono uppercase kicker, e.g. "MEDIAN LIST PRICE". */
  eyebrow: string
  /** Sentence-case figure title. */
  title: string
  /** Optional one-line explanation shown under the title. */
  caption?: string
  /** REQUIRED. Rendered in the footer. There is no unsourced figure on this site. */
  source: string
  /** Reserved size for the well: an aspect ratio, or a fixed height. Prevents CLS. */
  well: WellSize
  /** Optional controls rendered in the well's top-right (segmented control etc.). */
  controls?: ReactNode
  /**
   * The accessible equivalent, rendered inside <details>. Required for any figure whose visual
   * encodes information beyond the text already on the page (a chart, a map, a scale). Omit it
   * only when the visual itself already is the complete text content, e.g. a plain sequence of
   * labelled steps: in that case a text-equivalent disclosure would just repeat what's already
   * readable, which is not an equivalent, it's a duplicate.
   */
  table?: ReactNode
  /** Disclosure summary text. Defaults to "Show the numbers"; override for a non-numeric figure. */
  disclosureLabel?: string
  /** The visual itself. */
  children: ReactNode
  className?: string
}

/**
 * The shared visualisation chrome. Every visual on the site is a child of this: it is chrome
 * and an accessibility contract only, and owns no scale, colour choice, data or interaction.
 */
export function Figure({
  eyebrow,
  title,
  caption,
  source,
  well,
  controls,
  table,
  disclosureLabel = 'Show the numbers',
  children,
  className,
}: FigureProps) {
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
      <div className="viz-well" style={wellStyle(well)}>
        {children}
      </div>
      <figcaption className="viz-footer">
        <span className="viz-source">{source}</span>
        {table && (
          <details className="viz-disclosure">
            <summary className="viz-disclosure-label">{disclosureLabel}</summary>
            <div className="viz-table-wrap">{table}</div>
          </details>
        )}
      </figcaption>
    </figure>
  )
}
