'use client'

import type { CSSProperties } from 'react'
import clsx from 'clsx'
import type { BusinessGlyphKind } from '@/content/business'
import { DURATION } from '@/lib/motion'
import {
  ACCENT_STROKE,
  ACCENT_WIDTH,
  BOARD_GLYPH,
  CONTEXT_FILL,
  DOT_RADIUS,
  GLYPH_VIEWBOX,
  HANDOFF_GLYPH,
  HANDOFF_NODES,
  ROUTE_GLYPH,
  SEDAN_GLYPH,
  STRUCTURE_STROKE,
  STRUCTURE_WIDTH,
  type GlyphGeometry,
} from './business-geometry'

export interface BusinessGlyphProps {
  kind: BusinessGlyphKind
  /** True once the owning card has entered view, or immediately under reduced motion. */
  revealed: boolean
  /** From the parent's usePrefersReducedMotion(). This component mounts no hook of its own. */
  reduced: boolean
  /** Extra delay before this glyph's plate fade and accent draw, in ms. Default 0. */
  delayMs?: number
  /** Sizing only. The caller passes the responsive box, e.g. "h-16 w-16 sm:h-20 sm:w-20". */
  className?: string
}

const GEOMETRY: Record<BusinessGlyphKind, GlyphGeometry> = {
  route: ROUTE_GLYPH,
  sedan: SEDAN_GLYPH,
  board: BOARD_GLYPH,
  handoff: HANDOFF_GLYPH,
}

function plateStyle(revealed: boolean, reduced: boolean, delayMs: number): CSSProperties {
  if (reduced) {
    return {
      opacity: revealed ? 1 : 0,
      transition: 'opacity var(--dur-fast) var(--ease-out)',
    }
  }
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'none' : 'translateY(4px)',
    transition: 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
    transitionDelay: `${delayMs}ms`,
  }
}

function accentStyle(length: number, revealed: boolean, reduced: boolean, delayMs: number): CSSProperties {
  if (reduced) {
    return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
  }
  return {
    strokeDasharray: length,
    strokeDashoffset: revealed ? 0 : length,
    transition: 'stroke-dashoffset var(--dur-base) var(--ease-out)',
    transitionDelay: `${DURATION.base * 1000 + delayMs}ms`,
  }
}

/**
 * The four small marks (route, sedan, board, handoff), reading their coordinates from
 * business-geometry.ts and their reveal state from the caller. Mirrors RoleGlyph's contract and
 * motion exactly, with one addition: a delayMs so a grid of glyphs (AudienceGrid) can stagger
 * without each one owning its own in-view hook.
 */
export function BusinessGlyph({ kind, revealed, reduced, delayMs = 0, className }: BusinessGlyphProps) {
  const geometry = GEOMETRY[kind]
  const accent = accentStyle(geometry.accent.length, revealed, reduced, delayMs)

  return (
    <span
      style={plateStyle(revealed, reduced, delayMs)}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-1',
        className,
      )}
    >
      <svg
        viewBox={GLYPH_VIEWBOX}
        role="img"
        aria-label={geometry.label}
        className="h-full w-full"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {geometry.cards.map((card) => (
          <rect
            key={`card-${card.x}-${card.y}`}
            x={card.x}
            y={card.y}
            width={card.w}
            height={card.h}
            rx={card.rx}
            fill={CONTEXT_FILL}
          />
        ))}
        {geometry.dots.map((dot) => (
          <circle key={`dot-${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill={CONTEXT_FILL} />
        ))}
        {geometry.structure.map((path) => (
          <path
            key={path.d}
            d={path.d}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
          />
        ))}
        {geometry.rings.map((ring) => (
          <circle
            key={`ring-${ring.cx}-${ring.cy}`}
            cx={ring.cx}
            cy={ring.cy}
            r={ring.r}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
          />
        ))}
        {geometry.circles.map((circle) => (
          <circle
            key={`circle-${circle.cx}-${circle.cy}`}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
          />
        ))}
        {kind === 'handoff' &&
          HANDOFF_NODES.map((node) => (
            <rect
              key={`node-${node.x}-${node.y}`}
              x={node.x}
              y={node.y}
              width={node.w}
              height={node.h}
              rx={node.rx}
              fill="none"
              stroke={STRUCTURE_STROKE}
              strokeWidth={STRUCTURE_WIDTH}
            />
          ))}
        {'d' in geometry.accent ? (
          <path d={geometry.accent.d} fill="none" stroke={ACCENT_STROKE} strokeWidth={ACCENT_WIDTH} style={accent} />
        ) : (
          <rect
            x={geometry.accent.rect.x}
            y={geometry.accent.rect.y}
            width={geometry.accent.rect.w}
            height={geometry.accent.rect.h}
            rx={geometry.accent.rect.rx}
            fill="none"
            stroke={ACCENT_STROKE}
            strokeWidth={ACCENT_WIDTH}
            style={accent}
          />
        )}
      </svg>
    </span>
  )
}
