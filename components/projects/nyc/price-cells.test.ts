import { describe, expect, it } from 'vitest'
import {
  breaksFor,
  CELL_BY_KEY,
  CELL_COLLECTION,
  COUNT_BREAKS,
  DATA_BOUNDS,
  rampStepRows,
} from './price-cells'

describe('components/projects/nyc/price-cells: geometry', () => {
  it('has exactly 2,244 features, each a single closed 5-position ring', () => {
    expect(CELL_COLLECTION.features).toHaveLength(2244)
    for (const feature of CELL_COLLECTION.features) {
      expect(feature.geometry.type).toBe('Polygon')
      expect(feature.geometry.coordinates).toHaveLength(1)
      const ring = feature.geometry.coordinates[0]
      expect(ring).toHaveLength(5)
      expect(ring[0]).toEqual(ring[4])
    }
  })

  it('builds the exact ring and properties for cell 8100:-14850', () => {
    const feature = CELL_COLLECTION.features.find((f) => f.properties.k === '8100:-14850')
    expect(feature).toBeDefined()
    expect(feature?.geometry.coordinates).toEqual([
      [
        [-74.2525, 40.4975],
        [-74.2475, 40.4975],
        [-74.2475, 40.5025],
        [-74.2525, 40.5025],
        [-74.2525, 40.4975],
      ],
    ])
    expect(feature?.properties).toEqual({
      k: '8100:-14850',
      n: 9,
      med: 1100000,
      sqft: 192,
      b: 4,
    })
  })

  it('every ring coordinate round-trips at four decimal places', () => {
    for (const feature of CELL_COLLECTION.features) {
      for (const [lng, lat] of feature.geometry.coordinates[0]) {
        for (const v of [lng, lat]) {
          expect(Math.round(v * 1e4) / 1e4).toBe(v)
          expect(Number(v.toFixed(4))).toBe(v)
        }
      }
    }
  })

  it('marks exactly 150 cells with no sqft property, never sqft: null, including 8111:-14786', () => {
    const noSqft = CELL_COLLECTION.features.filter((f) => !('sqft' in f.properties))
    expect(noSqft).toHaveLength(150)
    for (const feature of CELL_COLLECTION.features) {
      expect(feature.properties.sqft).not.toBeNull()
    }
    const key = noSqft.map((f) => f.properties.k)
    expect(key).toContain('8111:-14786')
  })
})

describe('components/projects/nyc/price-cells: breaks and bounds', () => {
  it('COUNT_BREAKS is the exact, strictly ascending septile split', () => {
    expect(COUNT_BREAKS).toEqual([8, 14, 20, 27, 34, 46])
    for (let i = 1; i < COUNT_BREAKS.length; i += 1) {
      expect(COUNT_BREAKS[i]).toBeGreaterThan(COUNT_BREAKS[i - 1])
    }
  })

  it('DATA_BOUNDS is the exact rectangle over the surviving cells, and is not readonly', () => {
    expect(DATA_BOUNDS).toEqual([
      [-74.2575, 40.4975],
      [-73.6975, 40.9125],
    ])
    const asBoundsLike: [[number, number], [number, number]] = DATA_BOUNDS
    expect(asBoundsLike).toBe(DATA_BOUNDS)
  })
})

describe('components/projects/nyc/price-cells: ramp step rows', () => {
  it('density: cells and listings per step', () => {
    const { rows } = rampStepRows('density')
    expect(rows.map((r) => r.cells)).toEqual([294, 343, 317, 324, 292, 352, 322])
    expect(rows.map((r) => r.listings)).toEqual([1592, 3540, 5237, 7422, 8699, 13675, 18590])
  })

  it('median: cells and listings per step', () => {
    const { rows } = rampStepRows('median')
    expect(rows.map((r) => r.cells)).toEqual([315, 314, 333, 316, 325, 320, 321])
    expect(rows.map((r) => r.listings)).toEqual([9637, 9702, 9185, 7639, 8072, 7309, 7211])
  })

  it('perSqft: cells and listings per step, plus the no-value tally', () => {
    const summary = rampStepRows('perSqft')
    expect(summary.rows.map((r) => r.cells)).toEqual([298, 298, 294, 302, 303, 299, 300])
    expect(summary.rows.map((r) => r.listings)).toEqual([7208, 8514, 8783, 9160, 8045, 7875, 7825])
    expect(summary.rows.reduce((sum, r) => sum + r.cells, 0)).toBe(2094)
    expect(summary.rows.reduce((sum, r) => sum + r.listings, 0)).toBe(57410)
    expect(summary.noValueCells).toBe(150)
    expect(summary.noValueListings).toBe(1345)
  })

  it.each(['density', 'median', 'perSqft'] as const)('%s: row bounds line up with breaksFor', (view) => {
    const { rows } = rampStepRows(view)
    const breaks = breaksFor(view)
    expect(rows[0].lower).toBeNull()
    expect(rows[6].upper).toBeNull()
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i].lower).toBe(breaks[i - 1])
    }
    for (let i = 0; i < rows.length - 1; i += 1) {
      expect(rows[i].upper).toBe(breaks[i])
    }
  })
})

describe('components/projects/nyc/price-cells: CELL_BY_KEY', () => {
  it('holds one entry per feature, matching n, med and b', () => {
    expect(CELL_BY_KEY.size).toBe(2244)
    for (const feature of CELL_COLLECTION.features) {
      const cell = CELL_BY_KEY.get(feature.properties.k)
      expect(cell).toBeDefined()
      expect(cell?.n).toBe(feature.properties.n)
      expect(cell?.med).toBe(feature.properties.med)
      expect(cell?.b).toBe(feature.properties.b)
    }
  })
})
