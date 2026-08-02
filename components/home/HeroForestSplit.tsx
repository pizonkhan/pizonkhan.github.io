'use client'

import { useEffect, useState } from 'react'
import { DURATION, STAGGER, usePrefersReducedMotion } from '@/lib/motion'

/**
 * The hero's third decorative technical visual: three small trees, each splitting a two-point
 * scatter on its own axis (vertical, horizontal, diagonal, standing in for an ensemble's
 * decorrelated trees), then three connectors carrying each tree's output down to a single
 * point where one accent mark settles as the combined result. Same three-beat shape
 * HeroNeighborFill and HeroLinearFit use: data settles, structure appears, the operation's
 * result arrives last.
 *
 * Purely decorative and aria-hidden, exactly like HeroNeighborFill: the hero's real content
 * (name, title, positioning paragraph) carries the meaning a screen reader needs.
 */

const CONTEXT_FILL = 'var(--text-tertiary)'
const STRUCTURE_STROKE = 'var(--text-primary)'
const ACCENT_STROKE = 'var(--accent)'

const STRUCTURE_WIDTH = 1.5
const DOT_RADIUS = 2.5

const CONVERGE_X = 48
const CONVERGE_Y = 84

/** The six points each tree splits, two per tree: left, center, right. */
const DOTS: readonly [number, number][] = [
  [8, 20],
  [26, 20],
  [48, 8],
  [48, 32],
  [86, 12],
  [72, 28],
]

/** Each tree's split line: left tree vertical, center tree horizontal, right tree diagonal. */
const SPLITS: readonly { d: string; length: number }[] = [
  { d: 'M 16 6 L 16 34', length: 28 },
  { d: 'M 36 20 L 60 20', length: 24 },
  { d: 'M 70 6 L 88 34', length: 33.3 },
]

/** Each tree's output, carried from its split line to the single convergence point. */
const CONVERGENCE: readonly { d: string; length: number }[] = [
  { d: 'M 16 34 L 48 84', length: 59.4 },
  { d: 'M 48 20 L 48 84', length: 64 },
  { d: 'M 79 20 L 48 84', length: 71.1 },
]

/** The dot fade-in stagger: 6 dots at --stagger apart, the cadence HeroNeighborFill uses. */
const DOT_STAGGER_MS = STAGGER * 1000
const DOT_DURATION_MS = DURATION.slow * 1000

/** Splits start once the dot stagger has mostly played out, then draw one at a time. */
const SPLIT_START_MS = DOT_STAGGER_MS * DOTS.length + 320
const SPLIT_STEP_MS = DURATION.base * 1000

/** Convergence lines draw one at a time once every split has appeared. */
const CONVERGE_START_MS = SPLIT_START_MS + SPLIT_STEP_MS * SPLITS.length
const CONVERGE_STEP_MS = DURATION.base * 1000

/** The combined result settles last, slower than the lines feeding it, as the one accent mark. */
const RESULT_START_MS = CONVERGE_START_MS + CONVERGE_STEP_MS * CONVERGENCE.length
const RESULT_DURATION_MS = DURATION.draw * 1000

function dotStyle(index: number, playing: boolean, reduced: boolean) {
  if (reduced) return { opacity: 1 }
  return {
    opacity: playing ? 1 : 0,
    transition: `opacity ${DOT_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${index * DOT_STAGGER_MS}ms`,
  }
}

/** Shared by SPLITS and CONVERGENCE: both are a same-shaped "draw one at a time" group. */
function drawStyle(
  index: number,
  length: number,
  startMs: number,
  stepMs: number,
  playing: boolean,
  reduced: boolean,
) {
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0 }
  return {
    strokeDasharray: length,
    strokeDashoffset: playing ? 0 : length,
    transition: `stroke-dashoffset ${stepMs}ms var(--ease-out)`,
    transitionDelay: `${startMs + index * stepMs}ms`,
  }
}

function resultStyle(playing: boolean, reduced: boolean) {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: playing ? 1 : 0,
    transform: playing ? 'none' : 'translateY(4px)',
    transition: `opacity ${RESULT_DURATION_MS}ms var(--ease-out), transform ${RESULT_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${RESULT_START_MS}ms`,
  }
}

export function HeroForestSplit() {
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
        {DOTS.map(([cx, cy], index) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={DOT_RADIUS}
            fill={CONTEXT_FILL}
            style={dotStyle(index, playing, reduced)}
          />
        ))}

        {SPLITS.map((split, index) => (
          <path
            key={split.d}
            d={split.d}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
            style={drawStyle(index, split.length, SPLIT_START_MS, SPLIT_STEP_MS, playing, reduced)}
          />
        ))}

        {CONVERGENCE.map((connector, index) => (
          <path
            key={connector.d}
            d={connector.d}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
            style={drawStyle(index, connector.length, CONVERGE_START_MS, CONVERGE_STEP_MS, playing, reduced)}
          />
        ))}

        <circle cx={CONVERGE_X} cy={CONVERGE_Y} r={6} fill={ACCENT_STROKE} style={resultStyle(playing, reduced)} />
      </svg>
    </div>
  )
}
