import { describe, expect, it } from 'vitest'
import {
  BOARD_GLYPH,
  HANDOFF_GLYPH,
  HANDOFF_NODES,
  HERO_ROUTE,
  HERO_VIEWBOX,
  ROUTE_GLYPH,
  SEDAN_GLYPH,
  SEDAN_MINI,
  polylineLength,
  roundedRectPerimeter,
  type DrawPath,
  type GlyphGeometry,
} from './business-geometry'

/**
 * Guards the pure geometry every business visual draws from (acceptance criteria 14 to 17 in
 * docs/plans/business-page-and-landing-section.md). No component renders here: this is
 * coordinates and declared lengths only.
 */

const GLYPHS: Record<string, GlyphGeometry> = {
  ROUTE_GLYPH,
  SEDAN_GLYPH,
  BOARD_GLYPH,
  HANDOFF_GLYPH,
}

function collectDrawPaths(): Record<string, DrawPath> {
  const paths: Record<string, DrawPath> = {}
  for (const [glyphName, glyph] of Object.entries(GLYPHS)) {
    glyph.structure.forEach((path, index) => {
      paths[`${glyphName}.structure[${index}]`] = path
    })
    if ('d' in glyph.accent) {
      paths[`${glyphName}.accent`] = glyph.accent
    }
  }
  paths['SEDAN_MINI.body'] = SEDAN_MINI.body
  paths['SEDAN_MINI.cabin'] = SEDAN_MINI.cabin
  paths['HERO_ROUTE.route'] = HERO_ROUTE.route
  paths['HERO_ROUTE.road'] = HERO_ROUTE.road
  return paths
}

describe('polylineLength', () => {
  it('measures a simple right-angle path', () => {
    expect(polylineLength('M 0 0 L 3 0 L 3 4')).toBeCloseTo(7, 5)
  })

  it('measures a diagonal path with the euclidean distance', () => {
    expect(polylineLength('M 0 0 L 3 4')).toBeCloseTo(5, 5)
  })

  it('throws on a command it does not support', () => {
    expect(() => polylineLength('M 0 0 C 1 1 2 2 3 3')).toThrow()
  })
})

describe('roundedRectPerimeter', () => {
  it('matches the formula RoleGlyph.tsx already ships (28x28, rx 6 -> 101.7)', () => {
    expect(roundedRectPerimeter(28, 28, 6)).toBeCloseTo(101.7, 2)
  })

  it('matches BOARD_GLYPH.accent.length to within 0.1', () => {
    const perimeter = roundedRectPerimeter(18, 7, 2)
    expect('rect' in BOARD_GLYPH.accent ? BOARD_GLYPH.accent.length : NaN).toBeCloseTo(
      perimeter,
      1,
    )
  })
})

describe('every declared DrawPath length is safe for stroke-dasharray', () => {
  const paths = collectDrawPaths()

  for (const [name, path] of Object.entries(paths)) {
    it(`${name}: declared length is at least the true length and within 2 units of it`, () => {
      const trueLength = polylineLength(path.d)
      expect(path.length).toBeGreaterThanOrEqual(trueLength)
      expect(path.length - trueLength).toBeLessThan(2)
    })
  }
})

describe('every glyph has exactly one accent element', () => {
  for (const [name, glyph] of Object.entries(GLYPHS)) {
    it(`${name}.accent is a single value, not an array`, () => {
      expect(Array.isArray(glyph.accent)).toBe(false)
      expect(glyph.accent).toBeDefined()
    })
  }
})

describe('every coordinate lies inside its viewBox', () => {
  const GLYPH_MIN = 0
  const GLYPH_MAX = 96

  function pointsFromPath(d: string): [number, number][] {
    const tokens = d.trim().split(/\s+/)
    const points: [number, number][] = []
    for (let i = 0; i < tokens.length; i += 3) {
      points.push([Number(tokens[i + 1]), Number(tokens[i + 2])])
    }
    return points
  }

  function expectWithin(x: number, y: number, min: number, max: number, label: string) {
    expect(x, `${label} x`).toBeGreaterThanOrEqual(min)
    expect(x, `${label} x`).toBeLessThanOrEqual(max)
    expect(y, `${label} y`).toBeGreaterThanOrEqual(min)
    expect(y, `${label} y`).toBeLessThanOrEqual(max)
  }

  for (const [name, glyph] of Object.entries(GLYPHS)) {
    it(`${name}: dots, rings, cards, structure, circles and accent stay within [0, 96]`, () => {
      for (const dot of glyph.dots) expectWithin(dot.cx, dot.cy, GLYPH_MIN, GLYPH_MAX, `${name} dot`)
      for (const ring of glyph.rings) {
        expectWithin(ring.cx - ring.r, ring.cy - ring.r, GLYPH_MIN, GLYPH_MAX, `${name} ring min`)
        expectWithin(ring.cx + ring.r, ring.cy + ring.r, GLYPH_MIN, GLYPH_MAX, `${name} ring max`)
      }
      for (const card of glyph.cards) {
        expectWithin(card.x, card.y, GLYPH_MIN, GLYPH_MAX, `${name} card min`)
        expectWithin(card.x + card.w, card.y + card.h, GLYPH_MIN, GLYPH_MAX, `${name} card max`)
      }
      for (const path of glyph.structure) {
        for (const [x, y] of pointsFromPath(path.d)) expectWithin(x, y, GLYPH_MIN, GLYPH_MAX, `${name} structure`)
      }
      for (const circle of glyph.circles) {
        expectWithin(circle.cx - circle.r, circle.cy - circle.r, GLYPH_MIN, GLYPH_MAX, `${name} circle min`)
        expectWithin(circle.cx + circle.r, circle.cy + circle.r, GLYPH_MIN, GLYPH_MAX, `${name} circle max`)
      }
      if ('d' in glyph.accent) {
        for (const [x, y] of pointsFromPath(glyph.accent.d)) {
          expectWithin(x, y, GLYPH_MIN, GLYPH_MAX, `${name} accent`)
        }
      } else {
        const { rect } = glyph.accent
        expectWithin(rect.x, rect.y, GLYPH_MIN, GLYPH_MAX, `${name} accent rect min`)
        expectWithin(rect.x + rect.w, rect.y + rect.h, GLYPH_MIN, GLYPH_MAX, `${name} accent rect max`)
      }
    })
  }

  it('HANDOFF_NODES rects stay within [0, 96]', () => {
    for (const node of HANDOFF_NODES) {
      expectWithin(node.x, node.y, GLYPH_MIN, GLYPH_MAX, 'HANDOFF_NODES min')
      expectWithin(node.x + node.w, node.y + node.h, GLYPH_MIN, GLYPH_MAX, 'HANDOFF_NODES max')
    }
  })

  it('HERO_ROUTE coordinates stay within [0, 120] on x and [0, 96] on y', () => {
    expect(HERO_VIEWBOX).toBe('0 0 120 96')
    const xMax = 120
    const yMax = 96

    for (const line of HERO_ROUTE.grid) {
      for (const [x, y] of pointsFromPath(line)) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(xMax)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(yMax)
      }
    }

    const ringPoints: [number, number][] = [
      [HERO_ROUTE.pickup.cx - HERO_ROUTE.pickup.r, HERO_ROUTE.pickup.cy - HERO_ROUTE.pickup.r],
      [HERO_ROUTE.pickup.cx + HERO_ROUTE.pickup.r, HERO_ROUTE.pickup.cy + HERO_ROUTE.pickup.r],
      [HERO_ROUTE.dropoff.cx - HERO_ROUTE.dropoff.r, HERO_ROUTE.dropoff.cy - HERO_ROUTE.dropoff.r],
      [HERO_ROUTE.dropoff.cx + HERO_ROUTE.dropoff.r, HERO_ROUTE.dropoff.cy + HERO_ROUTE.dropoff.r],
    ]
    for (const [x, y] of ringPoints) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(xMax)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(yMax)
    }

    for (const [x, y] of [...pointsFromPath(HERO_ROUTE.route.d), ...pointsFromPath(HERO_ROUTE.road.d)]) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(xMax)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(yMax)
    }
  })
})
