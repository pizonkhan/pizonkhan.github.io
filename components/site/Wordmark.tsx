import Link from 'next/link'
import type { CSSProperties } from 'react'
import clsx from 'clsx'
import { withBasePath } from '@/lib/base-path'
import { site } from '@/content/site'

export interface WordmarkProps {
  /** Rendered mark height in px. 32 in the header, 28 in the footer. Drives the reserved box. */
  height?: number
  /** Renders as a link to '/' when true (header) and plain when false (footer). */
  asLink?: boolean
  className?: string
}

/**
 * The logo. Renders site.logo's stack mark as a light/dark <img> pair toggled by CSS. There
 * is no fallback branch: the mark exists, so this component only ever draws it.
 */
export function Wordmark({ height = 32, asLink = false, className }: WordmarkProps) {
  const { logo } = site
  const width = (height * logo.width) / logo.height

  const images = (
    <span
      className="logo-mark-box inline-flex shrink-0"
      style={{ '--wordmark-h': `${height}px`, width } as CSSProperties}
    >
      <img
        src={withBasePath(logo.src)}
        width={logo.width}
        height={logo.height}
        alt={asLink ? '' : logo.alt}
        className="logo-mark logo-mark-light"
      />
      {logo.srcDark && (
        <img
          src={withBasePath(logo.srcDark)}
          width={logo.width}
          height={logo.height}
          alt={asLink ? '' : logo.alt}
          className="logo-mark logo-mark-dark"
        />
      )}
    </span>
  )

  if (!asLink) {
    return <span className={clsx('inline-flex', className)}>{images}</span>
  }

  return (
    <Link
      href="/"
      aria-label={`${logo.alt}, home`}
      className={clsx(
        'inline-flex min-h-11 min-w-11 items-center justify-start -ms-2 ps-2',
        className,
      )}
    >
      {images}
    </Link>
  )
}
