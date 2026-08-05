import { describe, expect, it } from 'vitest'
import { polylineLength, type DrawPath } from '@/lib/viz/polyline'
import {
  ATOMIC_COMMIT,
  GLYPH_VIEWBOX,
  INTERVAL_JOIN,
  STAGE_GLYPHS,
  WAP_GATE,
  type FigureLayout,
  type GlyphPath,
  type StageGlyph,
  type SvgLabel,
} from './lakehouse-geometry'

/**
 * Guards the pure geometry every lakehouse SVG figure draws from (acceptance criteria 8 to 12 in
 * docs/plans/iceberg-lakehouse-project-page.md). No component renders here: this is coordinates
 * and declared lengths only.
 */

const LAYOUTS: Record<string, FigureLayout> = {
  'INTERVAL_JOIN.wide': INTERVAL_JOIN.wide,
  'INTERVAL_JOIN.stack': INTERVAL_JOIN.stack,
  'WAP_GATE.wide': WAP_GATE.wide,
  'WAP_GATE.stack': WAP_GATE.stack,
  'ATOMIC_COMMIT.wide': ATOMIC_COMMIT.wide,
  'ATOMIC_COMMIT.stack': ATOMIC_COMMIT.stack,
}

const FIGURES: Record<string, { wide: FigureLayout; stack: FigureLayout }> = {
  INTERVAL_JOIN,
  WAP_GATE,
  ATOMIC_COMMIT,
}

const GLYPHS: Record<string, StageGlyph> = STAGE_GLYPHS

function pointsFromPath(d: string): [number, number][] {
  const tokens = d.trim().split(/\s+/)
  const points: [number, number][] = []
  for (let i = 0; i < tokens.length; i += 3) {
    points.push([Number(tokens[i + 1]), Number(tokens[i + 2])])
  }
  return points
}

function expectWithin(x: number, y: number, width: number, height: number, label: string) {
  expect(x, `${label} x`).toBeGreaterThanOrEqual(0)
  expect(x, `${label} x`).toBeLessThanOrEqual(width)
  expect(y, `${label} y`).toBeGreaterThanOrEqual(0)
  expect(y, `${label} y`).toBeLessThanOrEqual(height)
}

function expectLabelWithin(label: SvgLabel, width: number, height: number, name: string) {
  expectWithin(label.x, label.y, width, height, `${name} label anchor`)
  const extent = 7.2 * label.text.length
  const halfExtent = 3.6 * label.text.length
  if (label.anchor === 'start') {
    expect(label.x + extent, `${name} label "${label.text}" start extent`).toBeLessThanOrEqual(
      width,
    )
  } else if (label.anchor === 'end') {
    expect(label.x - extent, `${name} label "${label.text}" end extent`).toBeGreaterThanOrEqual(
      0,
    )
  } else {
    expect(
      label.x - halfExtent,
      `${name} label "${label.text}" middle extent min`,
    ).toBeGreaterThanOrEqual(0)
    expect(
      label.x + halfExtent,
      `${name} label "${label.text}" middle extent max`,
    ).toBeLessThanOrEqual(width)
  }
}

/** Collects every DrawPath, including glyph paths, keyed by a human-readable location. */
function collectDrawPaths(): Record<string, DrawPath> {
  const paths: Record<string, DrawPath> = {}

  for (const [layoutName, layout] of Object.entries(LAYOUTS)) {
    layout.structure.forEach((path, index) => {
      paths[`${layoutName}.structure[${index}]`] = path
    })
    layout.dashed.forEach((path, index) => {
      paths[`${layoutName}.dashed[${index}]`] = path
    })
    layout.accent.forEach((path, index) => {
      paths[`${layoutName}.accent[${index}]`] = path
    })
  }

  for (const [glyphName, glyph] of Object.entries(GLYPHS)) {
    glyph.paths.forEach((path, index) => {
      paths[`STAGE_GLYPHS.${glyphName}.paths[${index}]`] = path
    })
  }

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

describe('every declared DrawPath length is safe for stroke-dasharray', () => {
  const paths = collectDrawPaths()

  for (const [name, path] of Object.entries(paths)) {
    it(`${name}: declared length is at least the true length and within 2 units of it`, () => {
      const trueLength = polylineLength(path.d)
      expect(path.length).toBeGreaterThanOrEqual(trueLength)
      expect(path.length - trueLength).toBeLessThan(2)
    })
  }

  it('covered every structure, dashed, accent and glyph path with no gaps', () => {
    // 8 + 1 + 3 (interval wide) + 8 + 1 + 3 (interval stack)
    // + 4 + 0 + 2 (wap wide) + 4 + 0 + 2 (wap stack)
    // + 7 + 1 + 1 (atomic wide) + 7 + 1 + 1 (atomic stack)
    // + 4 + 3 + 4 + 5 (glyphs)
    expect(Object.keys(paths).length).toBe(70)
  })
})

describe('every layout coordinate lies inside its own viewBox', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`${name}: viewBox matches width and height`, () => {
      expect(layout.viewBox).toBe(`0 0 ${layout.width} ${layout.height}`)
    })

    it(`${name}: structure and dashed path points stay within the viewBox`, () => {
      for (const path of [...layout.structure, ...layout.dashed]) {
        for (const [x, y] of pointsFromPath(path.d)) {
          expectWithin(x, y, layout.width, layout.height, `${name} structure/dashed`)
        }
      }
    })

    it(`${name}: accent path points stay within the viewBox`, () => {
      for (const path of layout.accent) {
        for (const [x, y] of pointsFromPath(path.d)) {
          expectWithin(x, y, layout.width, layout.height, `${name} accent`)
        }
      }
    })

    it(`${name}: ring bounding boxes stay within the viewBox`, () => {
      for (const ring of layout.rings) {
        expectWithin(
          ring.cx - ring.r,
          ring.cy - ring.r,
          layout.width,
          layout.height,
          `${name} ring min`,
        )
        expectWithin(
          ring.cx + ring.r,
          ring.cy + ring.r,
          layout.width,
          layout.height,
          `${name} ring max`,
        )
      }
    })

    it(`${name}: dot and accentDot bounding boxes stay within the viewBox`, () => {
      for (const dot of [...layout.dots, ...layout.accentDots]) {
        expectWithin(dot.cx - dot.r, dot.cy - dot.r, layout.width, layout.height, `${name} dot min`)
        expectWithin(dot.cx + dot.r, dot.cy + dot.r, layout.width, layout.height, `${name} dot max`)
      }
    })

    it(`${name}: every label anchor point and text extent stays within the viewBox`, () => {
      for (const label of layout.labels) {
        expectLabelWithin(label, layout.width, layout.height, name)
      }
    })
  }
})

describe('every glyph path stays within GLYPH_VIEWBOX', () => {
  expect(GLYPH_VIEWBOX).toBe('0 0 24 24')
  const GLYPH_SIZE = 24

  for (const [name, glyph] of Object.entries(GLYPHS)) {
    it(`${name}: paths and dots stay within [0, 24]`, () => {
      for (const path of glyph.paths) {
        for (const [x, y] of pointsFromPath(path.d)) {
          expectWithin(x, y, GLYPH_SIZE, GLYPH_SIZE, `${name} path`)
        }
      }
      for (const dot of glyph.dots) {
        expectWithin(dot.cx - dot.r, dot.cy - dot.r, GLYPH_SIZE, GLYPH_SIZE, `${name} dot min`)
        expectWithin(dot.cx + dot.r, dot.cy + dot.r, GLYPH_SIZE, GLYPH_SIZE, `${name} dot max`)
      }
    })
  }
})

describe('every figure exports both a wide and a stack layout', () => {
  for (const [name, figure] of Object.entries(FIGURES)) {
    it(`${name}: has a wide and a stack layout, each with at least one accent path`, () => {
      expect(figure.wide, `${name}.wide`).toBeDefined()
      expect(figure.stack, `${name}.stack`).toBeDefined()
      expect(figure.wide.accent.length, `${name}.wide.accent`).toBeGreaterThan(0)
      expect(figure.stack.accent.length, `${name}.stack.accent`).toBeGreaterThan(0)
    })
  }
})

describe('accent paths never repeat a structure or dashed d string in the same layout', () => {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`${name}: accent is disjoint from structure and dashed`, () => {
      const structureAndDashed = new Set([
        ...layout.structure.map((p) => p.d),
        ...layout.dashed.map((p) => p.d),
      ])
      for (const path of layout.accent) {
        expect(structureAndDashed.has(path.d), `${name} accent "${path.d}"`).toBe(false)
      }
    })
  }
})

describe('no d string is duplicated within any single array of any single layout', () => {
  function expectUnique(paths: readonly DrawPath[], label: string) {
    const seen = new Set<string>()
    for (const path of paths) {
      expect(seen.has(path.d), `${label} duplicate "${path.d}"`).toBe(false)
      seen.add(path.d)
    }
  }

  for (const [name, layout] of Object.entries(LAYOUTS)) {
    it(`${name}: structure, dashed and accent each have unique d strings`, () => {
      expectUnique(layout.structure, `${name}.structure`)
      expectUnique(layout.dashed, `${name}.dashed`)
      expectUnique(layout.accent, `${name}.accent`)
    })
  }

  for (const [name, glyph] of Object.entries(GLYPHS)) {
    it(`STAGE_GLYPHS.${name}: paths have unique d strings`, () => {
      expectUnique(glyph.paths, `STAGE_GLYPHS.${name}.paths`)
    })
  }
})

describe('the silver glyph is the only dashed glyph path, and it keeps a positive length', () => {
  for (const [name, glyph] of Object.entries(GLYPHS)) {
    const dashedPaths = glyph.paths.filter((path): path is GlyphPath => Boolean(path.dashed))

    if (name === 'silver') {
      it('silver has exactly one dashed path, its fourth', () => {
        expect(dashedPaths).toHaveLength(1)
        expect(glyph.paths[3].dashed).toBe(true)
        expect(glyph.paths[3].length).toBeGreaterThan(0)
      })
    } else {
      it(`${name} has no dashed path`, () => {
        expect(dashedPaths).toHaveLength(0)
      })
    }
  }
})
