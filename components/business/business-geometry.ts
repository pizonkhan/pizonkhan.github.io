/**
 * Every coordinate the business visuals draw, and the measured length of each accent element.
 *
 * Lengths are declared here rather than measured at runtime, the same way
 * components/experience/RoleGlyph.tsx declares DASH_LENGTH. Every path below is made only of
 * absolute M and L commands, so its length is exactly computable and business-geometry.test.ts
 * checks each declared value against polylineLength().
 *
 * The safe rounding direction is UP. stroke-dasharray equal to or greater than the true path
 * length hides the stroke completely at stroke-dashoffset = length; a value below the true
 * length leaves a permanently visible stub. The test enforces both bounds: at least the true
 * length, and within 2 units of it.
 */

export interface DrawPath {
  d: string
  /** stroke-dasharray and the unrevealed stroke-dashoffset. */
  length: number
}

export interface Dot { cx: number; cy: number }
export interface Ring { cx: number; cy: number; r: number }
export interface RoundedRect { x: number; y: number; w: number; h: number; rx: number }

/** One glyph: context marks, structure marks, and exactly one accent element. */
export interface GlyphGeometry {
  /** Describes only the drawing. Becomes the svg's aria-label. */
  label: string
  dots: readonly Dot[]
  rings: readonly Ring[]
  cards: readonly RoundedRect[]
  structure: readonly DrawPath[]
  circles: readonly Ring[]
  accent: DrawPath | { rect: RoundedRect; length: number }
}

export const GLYPH_VIEWBOX = '0 0 96 96'
export const STRUCTURE_WIDTH = 1.5
export const ACCENT_WIDTH = 2
export const DOT_RADIUS = 2.5
export const CONTEXT_FILL = 'var(--text-tertiary)'
export const CONTEXT_STROKE = 'var(--text-tertiary)'
export const STRUCTURE_STROKE = 'var(--text-primary)'
export const ACCENT_STROKE = 'var(--accent)'

/** Length of a path made only of absolute M and L commands. Throws on anything else. */
export function polylineLength(d: string): number {
  const tokens = d.trim().split(/\s+/)
  let index = 0
  let length = 0
  let current: [number, number] | null = null

  while (index < tokens.length) {
    const command = tokens[index]
    if (command !== 'M' && command !== 'L') {
      throw new Error(`polylineLength: unsupported command "${command}" in "${d}"`)
    }
    const x = Number(tokens[index + 1])
    const y = Number(tokens[index + 2])
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error(`polylineLength: unparseable coordinate near "${command}" in "${d}"`)
    }
    if (command === 'L' && current !== null) {
      length += Math.hypot(x - current[0], y - current[1])
    }
    current = [x, y]
    index += 3
  }

  return length
}

/** Perimeter of a rounded rect, the same formula RoleGlyph's platform rect was measured with. */
export function roundedRectPerimeter(w: number, h: number, rx: number): number {
  return 2 * (w - 2 * rx) + 2 * (h - 2 * rx) + 2 * Math.PI * rx
}

export const ROUTE_GLYPH: GlyphGeometry = {
  label: 'A pickup point and a drop-off point joined by a route.',
  dots: [{ cx: 22, cy: 72 }, { cx: 74, cy: 24 }],
  rings: [{ cx: 22, cy: 72, r: 5.5 }, { cx: 74, cy: 24, r: 5.5 }],
  cards: [],
  structure: [],
  circles: [],
  accent: { d: 'M 22 64 L 22 50 L 48 50 L 48 32 L 74 32', length: 84 },
}
// 14 + 26 + 18 + 26 = 84 exactly. The route starts 2.5 units clear of the pickup ring's top
// edge (72 - 5.5 = 66.5) and ends 2.5 clear of the drop-off ring's bottom edge (24 + 5.5 = 29.5).

export const SEDAN_GLYPH: GlyphGeometry = {
  label: 'A car in outline with two passengers.',
  // The passengers, sitting inside the cabin. Context, the same role dots play elsewhere.
  dots: [{ cx: 42, cy: 47 }, { cx: 54, cy: 47 }],
  rings: [],
  cards: [],
  structure: [
    { d: 'M 10 66 L 86 66', length: 76 },                       // the road
    { d: 'M 14 60 L 14 53 L 82 53 L 82 60', length: 82 },       // lower body, 7 + 68 + 7
  ],
  circles: [{ cx: 30, cy: 60, r: 6 }, { cx: 66, cy: 60, r: 6 }], // wheels, bottoms on y = 66
  accent: { d: 'M 28 53 L 36 40 L 60 40 L 68 53', length: 55 },
}
// Accent: sqrt(64 + 169) + 24 + sqrt(64 + 169) = 15.264 + 24 + 15.264 = 54.53, declared 55.

export const BOARD_GLYPH: GlyphGeometry = {
  label: 'Three columns of cards with one card outlined in the third column.',
  dots: [],
  rings: [],
  // Context cards. Filled --text-tertiary, rx 2.
  cards: [
    { x: 17, y: 30, w: 18, h: 7, rx: 2 },
    { x: 17, y: 42, w: 18, h: 7, rx: 2 },
    { x: 17, y: 54, w: 18, h: 7, rx: 2 },
    { x: 39, y: 30, w: 18, h: 7, rx: 2 },
    { x: 39, y: 42, w: 18, h: 7, rx: 2 },
    { x: 61, y: 30, w: 18, h: 7, rx: 2 },
  ],
  structure: [
    { d: 'M 14 20 L 82 20', length: 68 },   // header rule
    { d: 'M 37 26 L 37 80', length: 54 },   // separator between column 1 and 2
    { d: 'M 59 26 L 59 80', length: 54 },   // separator between column 2 and 3
  ],
  circles: [],
  // The card arriving in the empty slot of column 3.
  accent: { rect: { x: 61, y: 42, w: 18, h: 7, rx: 2 }, length: 46.6 },
}
// 2*(18-4) + 2*(7-4) + 2*pi*2 = 28 + 6 + 12.566 = 46.566, declared 46.6.

export const HANDOFF_GLYPH: GlyphGeometry = {
  label:
    'Four incoming lines. Three bend up into one node, the fourth runs straight into a second node.',
  dots: [{ cx: 14, cy: 24 }, { cx: 14, cy: 40 }, { cx: 14, cy: 56 }, { cx: 14, cy: 72 }],
  rings: [],
  cards: [
    // Rendered as outlined structure rects, not filled: see BusinessGlyph below.
  ],
  structure: [
    { d: 'M 18 24 L 38 24 L 38 18 L 60 18', length: 48 },   // 20 + 6 + 22
    { d: 'M 18 40 L 44 40 L 44 24 L 60 24', length: 58 },   // 26 + 16 + 16
    { d: 'M 18 56 L 50 56 L 50 30 L 60 30', length: 68 },   // 32 + 26 + 10
  ],
  circles: [],
  accent: { d: 'M 18 72 L 60 72', length: 42 },
}

/** The two node outlines HANDOFF_GLYPH draws in structure stroke. */
export const HANDOFF_NODES: readonly RoundedRect[] = [
  { x: 60, y: 12, w: 26, h: 24, rx: 6 },   // the assistant
  { x: 60, y: 60, w: 26, h: 24, rx: 6 },   // the office
]

/**
 * A 24 by 12 car, drawn at the origin. Wheel bottoms sit on local y = 12, so translating by
 * (tx, roadY - 12) parks it on a road line.
 */
export const SEDAN_MINI = {
  body: { d: 'M 2 9 L 2 4 L 26 4 L 26 9', length: 34 },        // 5 + 24 + 5
  wheels: [{ cx: 8, cy: 9, r: 3 }, { cx: 20, cy: 9, r: 3 }],
  cabin: { d: 'M 7 4 L 11 0 L 17 0 L 21 4', length: 18 },      // 5.657 + 6 + 5.657 = 17.31
  width: 24,
  height: 12,
} as const

export const HERO_VIEWBOX = '0 0 120 96'

/**
 * The header visual. A street grid, a pickup and a drop-off on grid crossings, the route
 * between them, a road along the bottom, and the car arriving on it.
 */
export const HERO_ROUTE = {
  /** Context texture. Stroke --text-tertiary at 0.75, no opacity: see the plan's contrast note. */
  grid: [
    'M 24 8 L 24 56', 'M 56 8 L 56 56', 'M 88 8 L 88 56',
    'M 8 16 L 104 16', 'M 8 32 L 104 32', 'M 8 48 L 104 48',
  ],
  gridWidth: 0.75,
  pickup: { cx: 24, cy: 48, r: 5.5 },     // on the x = 24 / y = 48 crossing
  dropoff: { cx: 88, cy: 16, r: 5.5 },    // on the x = 88 / y = 16 crossing
  route: { d: 'M 24 40 L 24 32 L 56 32 L 56 16 L 80 16', length: 80 },  // 8 + 32 + 16 + 24
  road: { d: 'M 8 84 L 112 84', length: 104 },
  /** SEDAN_MINI scaled up and parked on the road. */
  car: { scale: 1.6, translate: [37.6, 64.8] as const },
} as const
