'use client'

import type { BusinessGlyphKind } from '@/content/business'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { BusinessGlyph } from './BusinessGlyph'

export interface GlyphPlateProps {
  kind: BusinessGlyphKind
  /** Sizing only, forwarded to BusinessGlyph. */
  className?: string
}

/**
 * Self-driving wrapper around one BusinessGlyph: owns useInViewOnce and
 * usePrefersReducedMotion so a standalone glyph on a server-rendered page (the landing section,
 * the assistant section) does not need its own bespoke wrapper.
 */
export function GlyphPlate({ kind, className }: GlyphPlateProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLSpanElement>()
  const reduced = usePrefersReducedMotion()

  return (
    <span ref={ref} className="inline-flex">
      <BusinessGlyph kind={kind} revealed={reduced || hasEntered} reduced={reduced} className={className} />
    </span>
  )
}
