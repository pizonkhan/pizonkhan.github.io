'use client'

import type { CSSProperties } from 'react'
import clsx from 'clsx'
import {
  CONTEXT_FILL,
  GLYPH_VIEWBOX,
  GLYPH_WIDTH,
  STAGE_GLYPHS,
  STRUCTURE_STROKE,
} from './lakehouse-geometry'

export interface StageGlyphProps {
  kind: 'generation' | 'bronze' | 'silver' | 'gold'
  /** True once the owning figure has entered view, or immediately under reduced motion. */
  revealed: boolean
  /** From the parent's usePrefersReducedMotion(). This component mounts no hook of its own. */
  reduced: boolean
  /** Extra delay before this glyph's stroke draw, in ms. Default 0. */
  delayMs?: number
  /** Sizing only, e.g. "h-6 w-6". */
  className?: string
}

function drawStyle(length: number, delayMs: number, revealed: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
  return {
    strokeDasharray: length,
    strokeDashoffset: revealed ? 0 : length,
    transition: 'stroke-dashoffset var(--dur-draw) var(--ease-out)',
    transitionDelay: `${delayMs}ms`,
  }
}

/**
 * A path cannot carry both strokeDasharray '2 2' and strokeDasharray equal to its own length at
 * once, so the silver glyph's quarantined slab reveals by opacity instead of stroke-dashoffset.
 * This is the mechanism behind that mark being dashed rather than tinted.
 */
function dashedStyle(delayMs: number, revealed: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { strokeDasharray: '2 2', opacity: 1, transition: 'none' }
  return {
    strokeDasharray: '2 2',
    opacity: revealed ? 1 : 0,
    transition: 'opacity var(--dur-draw) var(--ease-out)',
    transitionDelay: `${delayMs}ms`,
  }
}

/**
 * One of the four medallion-layer marks MedallionFlow draws inline. Unlike RoleGlyph, these
 * carry no accent element: accent on this page belongs to the travelling dot and the three
 * section figures, and four accent marks inside the centrepiece would compete with the dot for
 * the same meaning.
 */
export function StageGlyph({ kind, revealed, reduced, delayMs = 0, className }: StageGlyphProps) {
  const glyph = STAGE_GLYPHS[kind]
  return (
    <svg
      viewBox={GLYPH_VIEWBOX}
      role="img"
      aria-label={glyph.label}
      className={clsx('shrink-0', className)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph.paths.map((path, index) => (
        <path
          key={`path:${index}`}
          d={path.d}
          fill="none"
          stroke={STRUCTURE_STROKE}
          strokeWidth={GLYPH_WIDTH}
          style={
            path.dashed
              ? dashedStyle(delayMs, revealed, reduced)
              : drawStyle(path.length, delayMs, revealed, reduced)
          }
        />
      ))}
      {glyph.dots.map((dot, index) => (
        <circle key={`dot:${index}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill={CONTEXT_FILL} />
      ))}
    </svg>
  )
}
