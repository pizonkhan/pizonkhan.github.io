'use client'

import { useEffect, useState } from 'react'
import { DURATION, STAGGER, usePrefersReducedMotion } from '@/lib/motion'

/**
 * The hero's second decorative technical visual: an animated least-squares fit. A scatter of
 * context points settles in, four of them grow a residual connector back to where the fit line
 * will land, and the fit line itself draws last as the one accent element, the same three-beat
 * shape HeroNeighborFill uses (data settles, structure appears, the operation's result draws).
 *
 * Purely decorative and aria-hidden, exactly like HeroNeighborFill: the hero's real content
 * (name, title, positioning paragraph) carries the meaning a screen reader needs.
 */

const CONTEXT_FILL = 'var(--text-tertiary)'
const STRUCTURE_STROKE = 'var(--text-primary)'
const ACCENT_STROKE = 'var(--accent)'

const STRUCTURE_WIDTH = 1.5
const ACCENT_WIDTH = 2
const DOT_RADIUS = 2.5

/** Points whose distance to the fit line is drawn as a residual connector. */
const RESIDUAL_POINTS: readonly [number, number][] = [
  [12, 79],
  [22, 58],
  [76, 32],
  [86, 15],
]

/** Further points on the same trend, scattered but left unconnected: more of the dataset. */
const CONTEXT: readonly [number, number][] = [
  [32, 62],
  [44, 40],
  [56, 47],
  [66, 28],
]

const ALL_DOTS = [...RESIDUAL_POINTS, ...CONTEXT]

/**
 * Residual connectors: a vertical drop from each point to the fit line at the same x. The fit
 * line is y = 74 - 0.7 * (x - 8), the line through (8, 74) and (88, 18); lengths below are the
 * vertical distance from each point to that line at its own x, computed by hand.
 */
const RESIDUALS: readonly { d: string; length: number }[] = [
  { d: 'M 12 79 L 12 71.2', length: 7.8 },
  { d: 'M 22 58 L 22 64.2', length: 6.2 },
  { d: 'M 76 32 L 76 26.4', length: 5.6 },
  { d: 'M 86 15 L 86 19.4', length: 4.4 },
]

/** The fit line itself, from (8, 74) to (88, 18): length sqrt(80^2 + 56^2). */
const FIT_LINE_D = 'M 8 74 L 88 18'
const FIT_LINE_LENGTH = 97.7

/** The dot fade-in stagger: 8 dots at --stagger apart, the cadence HeroNeighborFill uses. */
const DOT_STAGGER_MS = STAGGER * 1000
const DOT_DURATION_MS = DURATION.slow * 1000

/** Residuals start once the dot stagger has mostly played out, then draw one at a time. */
const RESIDUAL_START_MS = DOT_STAGGER_MS * ALL_DOTS.length + 320
const RESIDUAL_STEP_MS = DURATION.base * 1000

/** The fit line draws last, slower than the residuals, so it reads as the answer, not a step. */
const LINE_START_MS = RESIDUAL_START_MS + RESIDUAL_STEP_MS * RESIDUALS.length
const LINE_DURATION_MS = DURATION.draw * 1000

function dotStyle(index: number, playing: boolean, reduced: boolean) {
  if (reduced) return { opacity: 1 }
  return {
    opacity: playing ? 1 : 0,
    transition: `opacity ${DOT_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${index * DOT_STAGGER_MS}ms`,
  }
}

function residualStyle(index: number, length: number, playing: boolean, reduced: boolean) {
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0 }
  return {
    strokeDasharray: length,
    strokeDashoffset: playing ? 0 : length,
    transition: `stroke-dashoffset ${RESIDUAL_STEP_MS}ms var(--ease-out)`,
    transitionDelay: `${RESIDUAL_START_MS + index * RESIDUAL_STEP_MS}ms`,
  }
}

function lineStyle(playing: boolean, reduced: boolean) {
  if (reduced) return { strokeDasharray: FIT_LINE_LENGTH, strokeDashoffset: 0 }
  return {
    strokeDasharray: FIT_LINE_LENGTH,
    strokeDashoffset: playing ? 0 : FIT_LINE_LENGTH,
    transition: `stroke-dashoffset ${LINE_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${LINE_START_MS}ms`,
  }
}

export function HeroLinearFit() {
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
      <svg viewBox="0 0 96 96" className="h-full w-full" strokeLinecap="round" strokeLinejoin="round">
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

        {RESIDUALS.map((residual, index) => (
          <path
            key={residual.d}
            d={residual.d}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
            style={residualStyle(index, residual.length, playing, reduced)}
          />
        ))}

        <path
          d={FIT_LINE_D}
          fill="none"
          stroke={ACCENT_STROKE}
          strokeWidth={ACCENT_WIDTH}
          style={lineStyle(playing, reduced)}
        />
      </svg>
    </div>
  )
}
