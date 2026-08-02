'use client'

import { useEffect, useState } from 'react'
import { DURATION, STAGGER, usePrefersReducedMotion } from '@/lib/motion'

/**
 * The hero's decorative technical visual: a larger, animated version of the k-nearest-neighbors
 * glyph RoleGlyph draws for the Webster Bank Data Scientist role (content/experience/roles.ts,
 * kind: 'neighbors'). Same 96-unit geometry, same token rules, scaled up to fill the hero's
 * right column and given a genuine multi-step entrance instead of a single reveal, because the
 * hero's point is to watch the operation happen rather than to sit as a static mark on a card.
 *
 * Purely decorative and aria-hidden, exactly like KernelSweep's decorative mode: the hero's real
 * content (name, title, positioning paragraph) carries the meaning a screen reader needs.
 */

const CONTEXT_FILL = 'var(--text-tertiary)'
const STRUCTURE_STROKE = 'var(--text-primary)'
const ACCENT_STROKE = 'var(--accent)'

const STRUCTURE_WIDTH = 1.5
const ACCENT_WIDTH = 2
const DOT_RADIUS = 2.5

const QUERY_X = 48
const QUERY_Y = 48

/** The three closest neighbors, same coordinates RoleGlyph's neighbors glyph uses. */
const NEIGHBORS: readonly [number, number][] = [
  [32, 62],
  [66, 60],
  [27, 48],
]

/** Further context points, scattered but never connected: the rest of the dataset. */
const CONTEXT: readonly [number, number][] = [
  [48, 10],
  [86, 48],
  [48, 86],
  [21, 21],
  [76, 76],
]

const ALL_DOTS = [...NEIGHBORS, ...CONTEXT]

/** Connector paths from the query point to each neighbor, and each one's drawn length. */
const CONNECTORS: readonly { d: string; length: number }[] = [
  { d: `M ${QUERY_X} ${QUERY_Y} L 32 62`, length: 21.3 },
  { d: `M ${QUERY_X} ${QUERY_Y} L 66 60`, length: 21.6 },
  { d: `M ${QUERY_X} ${QUERY_Y} L 27 48`, length: 21 },
]

/** Circumference of the r=31 neighborhood circle, same radius RoleGlyph's accent ring uses. */
const CIRCLE_LENGTH = 194.8

/** The dot fade-in stagger: 8 dots at --stagger apart, the motion vocabulary's own 8-item cap. */
const DOT_STAGGER_MS = STAGGER * 1000
const DOT_DURATION_MS = DURATION.slow * 1000

/** The query point settles once the dot stagger has mostly played out. */
const QUERY_DELAY_MS = DOT_STAGGER_MS * ALL_DOTS.length + 320
const QUERY_DURATION_MS = DURATION.base * 1000

/** Connectors draw one at a time, each taking its own --dur-base before the next starts. */
const CONNECTOR_START_MS = QUERY_DELAY_MS + QUERY_DURATION_MS + 80
const CONNECTOR_STEP_MS = DURATION.base * 1000

/** The neighborhood circle draws last and parks. */
const CIRCLE_START_MS = CONNECTOR_START_MS + CONNECTOR_STEP_MS * CONNECTORS.length
const CIRCLE_DURATION_MS = DURATION.base * 1000

function dotStyle(index: number, playing: boolean, reduced: boolean) {
  if (reduced) return { opacity: 1 }
  return {
    opacity: playing ? 1 : 0,
    transition: `opacity ${DOT_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${index * DOT_STAGGER_MS}ms`,
  }
}

function queryStyle(playing: boolean, reduced: boolean) {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: playing ? 1 : 0,
    transform: playing ? 'none' : 'translateY(4px)',
    transition: `opacity ${QUERY_DURATION_MS}ms var(--ease-out), transform ${QUERY_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${QUERY_DELAY_MS}ms`,
  }
}

function connectorStyle(index: number, length: number, playing: boolean, reduced: boolean) {
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0 }
  return {
    strokeDasharray: length,
    strokeDashoffset: playing ? 0 : length,
    transition: `stroke-dashoffset ${CONNECTOR_STEP_MS}ms var(--ease-out)`,
    transitionDelay: `${CONNECTOR_START_MS + index * CONNECTOR_STEP_MS}ms`,
  }
}

function circleStyle(playing: boolean, reduced: boolean) {
  if (reduced) return { strokeDasharray: CIRCLE_LENGTH, strokeDashoffset: 0 }
  return {
    strokeDasharray: CIRCLE_LENGTH,
    strokeDashoffset: playing ? 0 : CIRCLE_LENGTH,
    transition: `stroke-dashoffset ${CIRCLE_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${CIRCLE_START_MS}ms`,
  }
}

export function HeroNeighborFill() {
  const reduced = usePrefersReducedMotion()
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    // One-shot: flips once after mount so the CSS transitions above animate from their
    // unrevealed state to their final one, then stays true. Never resets, never loops.
    const id = window.requestAnimationFrame(() => setPlaying(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div
      aria-hidden
      className="aspect-square w-full"
      style={reduced ? { opacity: playing ? 1 : 0, transition: `opacity ${DURATION.fast * 1000}ms var(--ease-out)` } : undefined}
    >
      <svg
        viewBox="0 0 96 96"
        className="h-full w-full"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ALL_DOTS.map(([cx, cy], index) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={DOT_RADIUS}
            fill={CONTEXT_FILL}
            style={dotStyle(index, playing, reduced)}
          />
        ))}

        {CONNECTORS.map((connector, index) => (
          <path
            key={connector.d}
            d={connector.d}
            fill="none"
            stroke={ACCENT_STROKE}
            strokeWidth={ACCENT_WIDTH}
            style={connectorStyle(index, connector.length, playing, reduced)}
          />
        ))}

        <circle
          cx={QUERY_X}
          cy={QUERY_Y}
          r={4.5}
          fill="var(--surface-1)"
          stroke={STRUCTURE_STROKE}
          strokeWidth={STRUCTURE_WIDTH}
          strokeDasharray="3 3"
          style={queryStyle(playing, reduced)}
        />

        <circle
          cx={QUERY_X}
          cy={QUERY_Y}
          r={31}
          fill="none"
          stroke={ACCENT_STROKE}
          strokeWidth={ACCENT_WIDTH}
          style={circleStyle(playing, reduced)}
        />
      </svg>
    </div>
  )
}
