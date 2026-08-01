import clsx from 'clsx'
import { Eyebrow } from '@/components/ui/Eyebrow'

export interface FigureSkeletonProps {
  /** The eyebrow the loaded figure will print. Rendered for real, not as a grey bar. */
  eyebrow: string
  /** The title the loaded figure will print. Rendered for real. */
  title: string
  /** True when the loaded figure has a caption, so that line is reserved too. */
  hasCaption?: boolean
  /** The same string Figure receives, e.g. "4 / 3". */
  ratio: string
  className?: string
}

/**
 * Figure's box model with an empty well: same header margins, real eyebrow and title, one
 * reserved line for the caption when the loaded figure has one, the well reserved at its
 * final aspect ratio, and one reserved footer line. No spinner, no shimmer, no pulse: a
 * titled empty well reads as "a figure is loading here" without needing its own
 * reduced-motion fallback.
 */
export function FigureSkeleton({ eyebrow, title, hasCaption, ratio, className }: FigureSkeletonProps) {
  return (
    <figure className={clsx('not-prose', className)} aria-busy="true">
      <div className="viz-figure-header">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h3 className="text-h3 mt-1 text-text-primary">{title}</h3>
          {hasCaption && <p className="viz-caption">&nbsp;</p>}
        </div>
      </div>
      <div className="viz-well" style={{ aspectRatio: ratio }} aria-hidden="true" />
      <div className="viz-footer" aria-hidden="true">
        <span className="viz-source">&nbsp;</span>
        <span>&nbsp;</span>
      </div>
    </figure>
  )
}
