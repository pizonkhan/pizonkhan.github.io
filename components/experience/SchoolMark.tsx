import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { withBasePath } from '@/lib/base-path'
import type { SchoolMark as SchoolMarkData } from '@/content/experience/schools'

export interface SchoolMarkProps {
  mark: SchoolMarkData
  /** Sizing only. */
  className?: string
}

/**
 * The education brand plate: a two-letter monogram in the school's own colour pair, or the
 * school's own artwork if `mark.image` is ever filled in. Always aria-hidden, because the
 * school's full name sits in the adjacent heading and is this mark's text equivalent. Never
 * animates. See docs/plans/experience-page-v2.md, assumptions 1-3, for why this ships a
 * monogram rather than a mascot or a logotype.
 */
export function SchoolMark({ mark, className }: SchoolMarkProps) {
  if (mark.image) {
    const { image } = mark
    return (
      <img
        src={withBasePath(image.src)}
        width={image.width}
        height={image.height}
        alt=""
        loading="lazy"
        decoding="async"
        className={clsx(
          'inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border-subtle object-contain sm:h-16 sm:w-16',
          className,
        )}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      style={
        {
          '--school-fill': mark.light.fill,
          '--school-ink': mark.light.ink,
          '--school-fill-dark': mark.dark.fill,
          '--school-ink-dark': mark.dark.ink,
        } as CSSProperties
      }
      className={clsx(
        'inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-(--school-fill) text-(color:--school-ink) dark:bg-(--school-fill-dark) dark:text-(color:--school-ink-dark) sm:h-16 sm:w-16',
        className,
      )}
    >
      <span className="text-h3 font-semibold tracking-tight">{mark.monogram}</span>
    </span>
  )
}
