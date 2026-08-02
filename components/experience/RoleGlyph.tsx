'use client'

import type { CSSProperties } from 'react'
import clsx from 'clsx'
import type { RoleGlyphKind } from '@/content/experience/roles'

export type { RoleGlyphKind }

export interface RoleGlyphProps {
  kind: RoleGlyphKind
  /** True once the owning role card has entered view, or immediately under reduced motion. */
  revealed: boolean
  /** From the parent's usePrefersReducedMotion(). This component mounts no hook of its own. */
  reduced: boolean
  /** Sizing only. The caller passes the responsive box, e.g. "h-16 w-16 sm:h-22 sm:w-22". */
  className?: string
}

/**
 * The accessible name for each glyph's <svg role="img">. Describes only the drawing: no
 * employer, portfolio, system or metric is named here.
 */
const LABEL: Record<RoleGlyphKind, string> = {
  platform: 'Three data streams merging into one published table.',
  boundary: 'A line separating two groups of points.',
  neighbors: 'An empty point filled from its three closest neighbors.',
  orchestration: 'Sources feeding one transform on a fixed schedule.',
  segments: 'Nine points grouped into three clusters around their centers.',
}

/**
 * The measured length of each glyph's single accent element, used as both stroke-dasharray and
 * the un-revealed stroke-dashoffset so the mark draws from nothing to whole. Computed once in
 * docs/plans/experience-page-v2.md rather than measured at runtime.
 */
const DASH_LENGTH: Record<RoleGlyphKind, number> = {
  platform: 101.7,
  boundary: 79.2,
  neighbors: 194.8,
  orchestration: 106,
  segments: 60,
}

const STRUCTURE_WIDTH = 1.5
const ACCENT_WIDTH = 2
const DOT_RADIUS = 2.5

const STRUCTURE_STROKE = 'var(--text-primary)'
const CONTEXT_FILL = 'var(--text-tertiary)'
const ACCENT_STROKE = 'var(--accent)'

/** Context dots (the data): filled --text-tertiary, r 2.5. */
function ContextDots({ points }: { points: readonly [number, number][] }) {
  return (
    <>
      {points.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={DOT_RADIUS} fill={CONTEXT_FILL} />
      ))}
    </>
  )
}

function plateStyle(revealed: boolean, reduced: boolean): CSSProperties {
  return {
    opacity: revealed ? 1 : 0,
    transform: revealed ? 'none' : 'translateY(4px)',
    transition: reduced
      ? 'opacity var(--dur-fast) var(--ease-out)'
      : 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
  }
}

function accentStyle(kind: RoleGlyphKind, revealed: boolean, reduced: boolean): CSSProperties {
  const length = DASH_LENGTH[kind]
  return {
    strokeDasharray: length,
    strokeDashoffset: revealed ? 0 : length,
    transition: reduced ? 'none' : 'stroke-dashoffset var(--dur-base) var(--ease-out) var(--dur-base)',
  }
}

/** platform: three data streams merging into one published table. */
function PlatformGlyph({ accent }: { accent: CSSProperties }) {
  return (
    <>
      <ContextDots points={[[10, 20], [10, 48], [10, 76]]} />
      <path
        d="M 16 20 H 34 C 44 20 44 48 54 48"
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
      />
      <path d="M 16 48 H 54" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path
        d="M 16 76 H 34 C 44 76 44 48 54 48"
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
      />
      <path d="M 54 48 H 58" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path d="M 64 44 H 80" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path d="M 64 51 H 80" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path d="M 64 58 H 80" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <rect
        x={58}
        y={34}
        width={28}
        height={28}
        rx={6}
        fill="none"
        stroke={ACCENT_STROKE}
        strokeWidth={ACCENT_WIDTH}
        style={accent}
      />
    </>
  )
}

/** boundary: a line separating two groups of points. */
function BoundaryGlyph({ accent }: { accent: CSSProperties }) {
  const leftDots: readonly [number, number][] = [[22, 34], [34, 26], [26, 52], [38, 64], [20, 72]]
  const rightDots: readonly [number, number][] = [[64, 22], [76, 34], [68, 46], [80, 58]]
  return (
    <>
      <ContextDots points={leftDots} />
      <ContextDots points={rightDots} />
      {rightDots.map(([cx, cy]) => (
        <circle
          key={`ring-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={5.5}
          fill="none"
          stroke={STRUCTURE_STROKE}
          strokeWidth={STRUCTURE_WIDTH}
        />
      ))}
      <path
        d="M 44 10 L 66 86"
        fill="none"
        stroke={ACCENT_STROKE}
        strokeWidth={ACCENT_WIDTH}
        style={accent}
      />
    </>
  )
}

/** neighbors: an empty point filled from its three closest neighbors. */
function NeighborsGlyph({ accent }: { accent: CSSProperties }) {
  const innerDots: readonly [number, number][] = [[32, 62], [66, 60], [27, 48]]
  const outerDots: readonly [number, number][] = [[48, 10], [86, 48], [48, 86], [21, 21], [76, 76]]
  return (
    <>
      <ContextDots points={innerDots} />
      <ContextDots points={outerDots} />
      <path d="M 48 48 L 32 62" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path d="M 48 48 L 66 60" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path d="M 48 48 L 27 48" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <circle
        cx={48}
        cy={48}
        r={4.5}
        fill="var(--surface-1)"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
        strokeDasharray="3 3"
      />
      <circle
        cx={48}
        cy={48}
        r={31}
        fill="none"
        stroke={ACCENT_STROKE}
        strokeWidth={ACCENT_WIDTH}
        style={accent}
      />
    </>
  )
}

/** orchestration: sources feeding one transform on a fixed schedule. */
function OrchestrationGlyph({ accent }: { accent: CSSProperties }) {
  return (
    <>
      <rect x={12} y={31} width={6} height={6} fill={STRUCTURE_STROKE} />
      <rect x={12} y={51} width={6} height={6} fill={STRUCTURE_STROKE} />
      <rect x={12} y={71} width={6} height={6} fill={STRUCTURE_STROKE} />
      <rect x={44} y={50} width={8} height={8} fill={STRUCTURE_STROKE} />
      <rect x={74} y={35} width={6} height={6} fill={STRUCTURE_STROKE} />
      <rect x={74} y={69} width={6} height={6} fill={STRUCTURE_STROKE} />
      <path
        d="M 18 34 H 40 V 51 H 44"
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
      />
      <path d="M 18 54 H 44" fill="none" stroke={STRUCTURE_STROKE} strokeWidth={STRUCTURE_WIDTH} />
      <path
        d="M 18 74 H 40 V 57 H 44"
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
      />
      <path
        d="M 52 51 H 64 V 38 H 74"
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
      />
      <path
        d="M 52 57 H 64 V 72 H 74"
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
      />
      <ContextDots points={[[23, 54], [31, 54], [39, 54]]} />
      <path
        d="M 10 12 H 86 M 26 7 V 17 M 48 7 V 17 M 70 7 V 17"
        fill="none"
        stroke={ACCENT_STROKE}
        strokeWidth={ACCENT_WIDTH}
        style={accent}
      />
    </>
  )
}

/** segments: nine points grouped into three clusters around their centers. */
function SegmentsGlyph({ accent }: { accent: CSSProperties }) {
  return (
    <>
      <ContextDots points={[[20, 26], [34, 20], [26, 42]]} />
      <ContextDots points={[[66, 24], [82, 36], [70, 42]]} />
      <ContextDots points={[[30, 74], [48, 76], [26, 60]]} />
      <ellipse
        cx={27}
        cy={31}
        rx={14}
        ry={16}
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
        strokeDasharray="3 3"
      />
      <ellipse
        cx={72}
        cy={32}
        rx={14}
        ry={14}
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
        strokeDasharray="3 3"
      />
      <ellipse
        cx={36}
        cy={69}
        rx={16}
        ry={13}
        fill="none"
        stroke={STRUCTURE_STROKE}
        strokeWidth={STRUCTURE_WIDTH}
        strokeDasharray="3 3"
      />
      <path
        d="M 23 30 H 33 M 28 25 V 35 M 65 32 H 75 M 70 27 V 37 M 32 68 H 42 M 37 63 V 73"
        fill="none"
        stroke={ACCENT_STROKE}
        strokeWidth={ACCENT_WIDTH}
        style={accent}
      />
    </>
  )
}

const GLYPHS: Record<RoleGlyphKind, (props: { accent: CSSProperties }) => React.JSX.Element> = {
  platform: PlatformGlyph,
  boundary: BoundaryGlyph,
  neighbors: NeighborsGlyph,
  orchestration: OrchestrationGlyph,
  segments: SegmentsGlyph,
}

/**
 * One of five decorative role marks: a small drawing that says at a glance what a role's work
 * looked like, never what its numbers were. Ink (--text-primary, --text-tertiary) marks the data
 * and its structure; --accent marks the single operation the role performs on it, entering by a
 * stroke-dashoffset draw once the owning card has entered view. Which role gets which kind lives
 * in content/experience/roles.ts, not here.
 */
export function RoleGlyph({ kind, revealed, reduced, className }: RoleGlyphProps) {
  const Glyph = GLYPHS[kind]
  return (
    <span
      style={plateStyle(revealed, reduced)}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-1',
        className,
      )}
    >
      <svg
        viewBox="0 0 96 96"
        role="img"
        aria-label={LABEL[kind]}
        className="h-full w-full"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph accent={accentStyle(kind, revealed, reduced)} />
      </svg>
    </span>
  )
}
