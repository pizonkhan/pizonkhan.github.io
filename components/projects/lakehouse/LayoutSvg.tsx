import type { CSSProperties } from 'react'
import clsx from 'clsx'
import {
  ACCENT_STROKE,
  ACCENT_WIDTH,
  CONTEXT_STROKE,
  LABEL_FONT_SIZE,
  RING_FILL,
  STRUCTURE_STROKE,
  STRUCTURE_WIDTH,
  type FigureLayout,
} from './lakehouse-geometry'

export type LayoutElementId = string

export interface LayoutSvgProps {
  layout: FigureLayout
  /** The svg's aria-label. Describes the drawing, never the numbers. */
  title: string
  /**
   * Inline style for one element, keyed `${kind}:${index}`. Must be pure and must return the
   * same value for the same id on every render with the same inputs. Undefined means no inline
   * style.
   */
  styleFor?: (id: LayoutElementId) => CSSProperties | undefined
  className?: string
}

const LABEL_TONE: Record<'primary' | 'secondary' | 'tertiary' | 'accent', string> = {
  primary: 'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  tertiary: 'var(--text-tertiary)',
  accent: 'var(--accent)',
}

/**
 * Turns one FigureLayout into SVG. Owns no data, no animation timeline and no Figure chrome:
 * every visual value below comes from the layout, and every animated value comes from styleFor.
 */
export function LayoutSvg({ layout, title, styleFor, className }: LayoutSvgProps) {
  return (
    <svg
      viewBox={layout.viewBox}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
      className={clsx('h-full w-full', className)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {layout.dashed.map((path, index) => (
        <path
          key={`dashed:${index}`}
          d={path.d}
          fill="none"
          stroke={CONTEXT_STROKE}
          strokeWidth={path.width ?? 1}
          strokeDasharray="3 4"
          style={styleFor?.(`dashed:${index}`)}
        />
      ))}
      {layout.structure.map((path, index) => (
        <path
          key={`structure:${index}`}
          d={path.d}
          fill="none"
          stroke={path.tone === 'tertiary' ? CONTEXT_STROKE : STRUCTURE_STROKE}
          strokeWidth={path.width ?? STRUCTURE_WIDTH}
          style={styleFor?.(`structure:${index}`)}
        />
      ))}
      {layout.rings.map((ring, index) => (
        <circle
          key={`ring:${index}`}
          cx={ring.cx}
          cy={ring.cy}
          r={ring.r}
          fill={RING_FILL}
          stroke={STRUCTURE_STROKE}
          strokeWidth={STRUCTURE_WIDTH}
          strokeDasharray={ring.dashed ? '3 3' : undefined}
          style={styleFor?.(`ring:${index}`)}
        />
      ))}
      {layout.dots.map((dot, index) => (
        <circle
          key={`dot:${index}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill={STRUCTURE_STROKE}
          style={styleFor?.(`dot:${index}`)}
        />
      ))}
      {layout.accent.map((path, index) => (
        <path
          key={`accent:${index}`}
          d={path.d}
          fill="none"
          stroke={ACCENT_STROKE}
          strokeWidth={path.width ?? ACCENT_WIDTH}
          style={styleFor?.(`accent:${index}`)}
        />
      ))}
      {layout.accentDots.map((dot, index) => (
        <circle
          key={`accentDot:${index}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill={ACCENT_STROKE}
          style={styleFor?.(`accentDot:${index}`)}
        />
      ))}
      {layout.labels.map((label, index) => (
        <text
          key={`label:${index}`}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          fontSize={LABEL_FONT_SIZE}
          fill={LABEL_TONE[label.tone]}
          className="font-sans"
          style={styleFor?.(`label:${index}`)}
        >
          {label.text}
        </text>
      ))}
    </svg>
  )
}
