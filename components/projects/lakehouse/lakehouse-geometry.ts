/**
 * Every coordinate and precomputed dash length the three SVG figures on
 * /projects/iceberg-lakehouse-platform/ draw: IntervalJoin, WapGate and AtomicCommit, each in a
 * wide and a stacked layout, plus the four medallion stage glyphs MedallionFlow draws inline.
 *
 * Lengths are declared here rather than measured at runtime, the same way
 * components/business/business-geometry.ts declares its own. lakehouse-geometry.test.ts checks
 * every one of them against polylineLength(), and the safe rounding direction is UP: a
 * stroke-dasharray at or above the true length hides the stroke completely at
 * stroke-dashoffset = length, while a value below it leaves a permanently visible stub.
 *
 * The module owns coordinates and lengths only. It imports nothing from React, renders nothing,
 * and holds no copy that is not an in-drawing label.
 */

import type { DrawPath } from '@/lib/viz/polyline'

export type { DrawPath } from '@/lib/viz/polyline'

export interface Dot {
  cx: number
  cy: number
  r: number
}

export interface Ring {
  cx: number
  cy: number
  r: number
  dashed?: boolean
}

export interface SvgLabel {
  x: number
  y: number
  text: string
  anchor: 'start' | 'middle' | 'end'
  tone: 'primary' | 'secondary' | 'tertiary' | 'accent'
}

export interface FigureLayout {
  viewBox: string
  width: number
  height: number
  /** Solid ink. Animated by stroke-dashoffset. */
  structure: readonly DrawPath[]
  /** Guide lines. strokeDasharray '3 4'. Never animated by dashoffset, only opacity. */
  dashed: readonly DrawPath[]
  rings: readonly Ring[]
  dots: readonly Dot[]
  /** The accent group. Exactly one idea per figure. */
  accent: readonly DrawPath[]
  accentDots: readonly Dot[]
  labels: readonly SvgLabel[]
}

/**
 * A glyph path can additionally be dashed rather than dash-offset-revealed: a path cannot carry
 * both strokeDasharray '2 2' and strokeDasharray equal to its own length at the same time. The
 * silver glyph's quarantined slab uses this. length still holds the true polyline length so
 * criterion 8 in docs/plans/iceberg-lakehouse-project-page.md stays uniform across every glyph
 * path; StageGlyph.tsx simply does not use it for a dashed path.
 */
export interface GlyphPath extends DrawPath {
  dashed?: boolean
}

export interface StageGlyph {
  /** Becomes the svg's aria-label. Describes the drawing only. */
  label: string
  paths: readonly GlyphPath[]
  dots: readonly Dot[]
}

export const GLYPH_VIEWBOX = '0 0 24 24'
export const LABEL_FONT_SIZE = 12
export const STRUCTURE_WIDTH = 1.5
export const ACCENT_WIDTH = 2
export const GLYPH_WIDTH = 1.25

export const STRUCTURE_STROKE = 'var(--text-primary)'
export const CONTEXT_STROKE = 'var(--text-tertiary)'
export const CONTEXT_FILL = 'var(--text-tertiary)'
export const ACCENT_STROKE = 'var(--accent)'
export const RING_FILL = 'var(--surface-2)'

export const INTERVAL_JOIN: { wide: FigureLayout; stack: FigureLayout } = {
  wide: {
    viewBox: '0 0 560 200',
    width: 560,
    height: 200,
    structure: [
      { d: 'M 40 150 L 520 150', length: 480, width: 1 },
      { d: 'M 40 145 L 40 155', length: 10, width: 1 },
      { d: 'M 520 145 L 520 155', length: 10, width: 1 },
      { d: 'M 46 60 L 274 60', length: 228, width: 2 },
      { d: 'M 46 52 L 46 68', length: 16 },
      { d: 'M 286 96 L 514 96', length: 228, width: 2 },
      { d: 'M 286 88 L 286 104', length: 16 },
      { d: 'M 268 132 L 268 168', length: 36, width: 1 },
    ],
    dashed: [{ d: 'M 280 34 L 280 160', length: 126, width: 1 }],
    rings: [
      { cx: 274, cy: 60, r: 4.5 },
      { cx: 514, cy: 96, r: 4.5 },
    ],
    dots: [{ cx: 268, cy: 150, r: 4.5 }],
    accent: [
      { d: 'M 268 150 L 300 150', length: 32, width: 2 },
      { d: 'M 292 145 L 300 150 L 292 155', length: 18.87, width: 2 },
      { d: 'M 300 143 L 300 102', length: 41, width: 2 },
    ],
    accentDots: [{ cx: 300, cy: 96, r: 3.5 }],
    labels: [
      { x: 46, y: 44, text: 'version 1', anchor: 'start', tone: 'secondary' },
      { x: 286, y: 80, text: 'version 2', anchor: 'start', tone: 'secondary' },
      { x: 280, y: 28, text: 'version boundary', anchor: 'middle', tone: 'tertiary' },
      { x: 268, y: 184, text: 'registered_at', anchor: 'middle', tone: 'secondary' },
      { x: 306, y: 146, text: '+1 second', anchor: 'start', tone: 'accent' },
    ],
  },
  stack: {
    viewBox: '0 0 280 280',
    width: 280,
    height: 280,
    structure: [
      { d: 'M 20 210 L 260 210', length: 240, width: 1 },
      { d: 'M 20 205 L 20 215', length: 10, width: 1 },
      { d: 'M 260 205 L 260 215', length: 10, width: 1 },
      { d: 'M 26 70 L 134 70', length: 108, width: 2 },
      { d: 'M 26 62 L 26 78', length: 16 },
      { d: 'M 146 130 L 254 130', length: 108, width: 2 },
      { d: 'M 146 122 L 146 138', length: 16 },
      { d: 'M 128 192 L 128 228', length: 36, width: 1 },
    ],
    dashed: [{ d: 'M 140 40 L 140 222', length: 182, width: 1 }],
    rings: [
      { cx: 134, cy: 70, r: 4.5 },
      { cx: 254, cy: 130, r: 4.5 },
    ],
    dots: [{ cx: 128, cy: 210, r: 4.5 }],
    accent: [
      { d: 'M 128 210 L 160 210', length: 32, width: 2 },
      { d: 'M 152 205 L 160 210 L 152 215', length: 18.87, width: 2 },
      { d: 'M 160 203 L 160 136', length: 67, width: 2 },
    ],
    accentDots: [{ cx: 160, cy: 130, r: 3.5 }],
    labels: [
      { x: 26, y: 54, text: 'version 1', anchor: 'start', tone: 'secondary' },
      { x: 146, y: 114, text: 'version 2', anchor: 'start', tone: 'secondary' },
      { x: 140, y: 32, text: 'boundary', anchor: 'middle', tone: 'tertiary' },
      { x: 128, y: 246, text: 'registered_at', anchor: 'middle', tone: 'secondary' },
      { x: 166, y: 206, text: '+1 second', anchor: 'start', tone: 'accent' },
    ],
  },
}

export const WAP_GATE: { wide: FigureLayout; stack: FigureLayout } = {
  wide: {
    viewBox: '0 0 560 260',
    width: 560,
    height: 260,
    structure: [
      { d: 'M 40 96 L 530 96', length: 490 },
      { d: 'M 120 90 L 150 44 L 380 44 L 410 90', length: 339.84 },
      { d: 'M 40 226 L 530 226', length: 490 },
      { d: 'M 120 220 L 150 174 L 380 174', length: 284.92 },
    ],
    dashed: [],
    rings: [
      { cx: 200, cy: 44, r: 5 },
      { cx: 310, cy: 44, r: 5 },
      { cx: 200, cy: 174, r: 5 },
      { cx: 310, cy: 174, r: 5, dashed: true },
    ],
    dots: [
      { cx: 120, cy: 96, r: 5.5 },
      { cx: 410, cy: 96, r: 5.5 },
      { cx: 120, cy: 226, r: 5.5 },
    ],
    accent: [
      { d: 'M 380 174 L 392 174', length: 12, width: 2 },
      { d: 'M 392 160 L 392 188', length: 28, width: 2 },
    ],
    accentDots: [],
    labels: [
      { x: 40, y: 116, text: 'main', anchor: 'start', tone: 'tertiary' },
      { x: 200, y: 30, text: 'dbt run', anchor: 'middle', tone: 'secondary' },
      { x: 310, y: 30, text: 'dbt test', anchor: 'middle', tone: 'secondary' },
      { x: 310, y: 64, text: 'pass', anchor: 'middle', tone: 'secondary' },
      { x: 432, y: 84, text: 'merge', anchor: 'start', tone: 'secondary' },
      { x: 40, y: 246, text: 'main', anchor: 'start', tone: 'tertiary' },
      { x: 200, y: 160, text: 'dbt run', anchor: 'middle', tone: 'secondary' },
      { x: 310, y: 160, text: 'dbt test', anchor: 'middle', tone: 'secondary' },
      { x: 310, y: 194, text: 'fail', anchor: 'middle', tone: 'secondary' },
      { x: 402, y: 178, text: 'blocked', anchor: 'start', tone: 'accent' },
    ],
  },
  stack: {
    viewBox: '0 0 280 340',
    width: 280,
    height: 340,
    structure: [
      { d: 'M 20 110 L 260 110', length: 240 },
      { d: 'M 60 104 L 82 60 L 188 60 L 210 104', length: 204.39 },
      { d: 'M 20 300 L 260 300', length: 240 },
      { d: 'M 60 294 L 82 250 L 200 250', length: 167.2 },
    ],
    dashed: [],
    rings: [
      { cx: 100, cy: 60, r: 5 },
      { cx: 172, cy: 60, r: 5 },
      { cx: 100, cy: 250, r: 5 },
      { cx: 172, cy: 250, r: 5, dashed: true },
    ],
    dots: [
      { cx: 60, cy: 110, r: 5.5 },
      { cx: 210, cy: 110, r: 5.5 },
      { cx: 60, cy: 300, r: 5.5 },
    ],
    accent: [
      { d: 'M 200 250 L 212 250', length: 12, width: 2 },
      { d: 'M 212 236 L 212 264', length: 28, width: 2 },
    ],
    accentDots: [],
    labels: [
      { x: 20, y: 130, text: 'main', anchor: 'start', tone: 'tertiary' },
      { x: 100, y: 46, text: 'dbt run', anchor: 'middle', tone: 'secondary' },
      { x: 172, y: 46, text: 'dbt test', anchor: 'middle', tone: 'secondary' },
      { x: 172, y: 80, text: 'pass', anchor: 'middle', tone: 'secondary' },
      { x: 216, y: 100, text: 'merge', anchor: 'start', tone: 'secondary' },
      { x: 20, y: 320, text: 'main', anchor: 'start', tone: 'tertiary' },
      { x: 100, y: 236, text: 'dbt run', anchor: 'middle', tone: 'secondary' },
      { x: 172, y: 236, text: 'dbt test', anchor: 'middle', tone: 'secondary' },
      { x: 172, y: 270, text: 'fail', anchor: 'middle', tone: 'secondary' },
      { x: 212, y: 282, text: 'blocked', anchor: 'middle', tone: 'accent' },
    ],
  },
}

export const ATOMIC_COMMIT: { wide: FigureLayout; stack: FigureLayout } = {
  wide: {
    viewBox: '0 0 560 210',
    width: 560,
    height: 210,
    structure: [
      { d: 'M 130 44 L 530 44', length: 400, width: 1, tone: 'tertiary' },
      { d: 'M 130 104 L 530 104', length: 400, width: 1, tone: 'tertiary' },
      { d: 'M 130 44 L 378 44', length: 248, width: 4, tone: 'primary' },
      { d: 'M 130 164 L 530 164', length: 400, width: 3, tone: 'primary' },
      { d: 'M 130 156 L 130 172', length: 16, width: 1.5 },
      { d: 'M 530 156 L 530 172', length: 16, width: 1.5 },
      { d: 'M 340 96 L 352 96 L 356 100 L 356 112 L 340 112 L 340 96', length: 61.66, width: 1.5 },
    ],
    dashed: [{ d: 'M 378 64 L 378 176', length: 112, width: 1 }],
    rings: [],
    dots: [],
    accent: [{ d: 'M 378 26 L 378 62', length: 36, width: 2 }],
    accentDots: [],
    labels: [
      { x: 20, y: 48, text: 'MERGE', anchor: 'start', tone: 'tertiary' },
      { x: 20, y: 108, text: 'MinIO', anchor: 'start', tone: 'tertiary' },
      { x: 20, y: 168, text: 'committed', anchor: 'start', tone: 'tertiary' },
      { x: 378, y: 18, text: 'SIGKILL', anchor: 'middle', tone: 'accent' },
      { x: 362, y: 126, text: 'one Parquet file lands', anchor: 'start', tone: 'secondary' },
      {
        x: 140,
        y: 186,
        text: 'row count and checksum unchanged',
        anchor: 'start',
        tone: 'secondary',
      },
    ],
  },
  stack: {
    viewBox: '0 0 280 310',
    width: 280,
    height: 310,
    structure: [
      { d: 'M 20 62 L 260 62', length: 240, width: 1, tone: 'tertiary' },
      { d: 'M 20 152 L 260 152', length: 240, width: 1, tone: 'tertiary' },
      { d: 'M 20 62 L 169 62', length: 149, width: 4, tone: 'primary' },
      { d: 'M 20 248 L 260 248', length: 240, width: 3, tone: 'primary' },
      { d: 'M 20 240 L 20 256', length: 16, width: 1.5 },
      { d: 'M 260 240 L 260 256', length: 16, width: 1.5 },
      { d: 'M 130 144 L 142 144 L 146 148 L 146 160 L 130 160 L 130 144', length: 61.66 },
    ],
    dashed: [{ d: 'M 169 82 L 169 260', length: 178, width: 1 }],
    rings: [],
    dots: [],
    accent: [{ d: 'M 169 44 L 169 80', length: 36, width: 2 }],
    accentDots: [],
    labels: [
      { x: 20, y: 40, text: 'MERGE', anchor: 'start', tone: 'tertiary' },
      { x: 169, y: 32, text: 'SIGKILL', anchor: 'middle', tone: 'accent' },
      { x: 20, y: 130, text: 'MinIO', anchor: 'start', tone: 'tertiary' },
      { x: 20, y: 178, text: 'one Parquet file lands', anchor: 'start', tone: 'secondary' },
      { x: 20, y: 226, text: 'committed', anchor: 'start', tone: 'tertiary' },
      { x: 20, y: 276, text: 'row count and checksum', anchor: 'start', tone: 'secondary' },
      { x: 20, y: 294, text: 'unchanged', anchor: 'start', tone: 'secondary' },
    ],
  },
}

export const STAGE_GLYPHS: Record<'generation' | 'bronze' | 'silver' | 'gold', StageGlyph> = {
  generation: {
    label: 'Three streams merging into one.',
    paths: [
      { d: 'M 3 6 L 11 6 L 15 12', length: 15.22 },
      { d: 'M 3 12 L 15 12', length: 12 },
      { d: 'M 3 18 L 11 18 L 15 12', length: 15.22 },
      { d: 'M 15 12 L 21 12', length: 6 },
    ],
    dots: [],
  },
  bronze: {
    label: 'Three slabs stacked in the order they were written.',
    paths: [
      { d: 'M 4 5 L 20 5 L 20 8 L 4 8 L 4 5', length: 38 },
      { d: 'M 4 10.5 L 20 10.5 L 20 13.5 L 4 13.5 L 4 10.5', length: 38 },
      { d: 'M 4 16 L 20 16 L 20 19 L 4 19 L 4 16', length: 38 },
    ],
    dots: [],
  },
  silver: {
    label: 'Two slabs kept, one diverted below them.',
    paths: [
      { d: 'M 4 4 L 20 4 L 20 7 L 4 7 L 4 4', length: 38 },
      { d: 'M 4 9 L 20 9 L 20 12 L 4 12 L 4 9', length: 38 },
      { d: 'M 12 12 L 12 16', length: 4 },
      { d: 'M 6 16 L 18 16 L 18 20 L 6 20 L 6 16', length: 32, dashed: true },
    ],
    dots: [],
  },
  gold: {
    label: 'A centre table with four spokes to four satellites.',
    paths: [
      { d: 'M 10 10 L 14 10 L 14 14 L 10 14 L 10 10', length: 16 },
      { d: 'M 12 10 L 12 5.5', length: 4.5 },
      { d: 'M 12 14 L 12 18.5', length: 4.5 },
      { d: 'M 10 12 L 5.5 12', length: 4.5 },
      { d: 'M 14 12 L 18.5 12', length: 4.5 },
    ],
    dots: [
      { cx: 12, cy: 4, r: 1.5 },
      { cx: 12, cy: 20, r: 1.5 },
      { cx: 4, cy: 12, r: 1.5 },
      { cx: 20, cy: 12, r: 1.5 },
    ],
  },
}
