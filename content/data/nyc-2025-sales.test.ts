import { describe, expect, it } from 'vitest'
import { BOROUGHS_2025, PRICE_BREAKS, PRICE_FILTER, SNAPSHOT } from './nyc-2025-sales'
import { NEIGHBORHOODS_2025 } from './nyc-2025-neighborhoods'

describe('content/data/nyc-2025-sales and nyc-2025-neighborhoods: internal consistency', () => {
  it('borough counts sum to SNAPSHOT.points', () => {
    const total = BOROUGHS_2025.reduce((sum, b) => sum + b.n, 0)
    expect(total).toBe(SNAPSHOT.points)
  })

  it('PRICE_BREAKS is strictly ascending and holds six breakpoints', () => {
    expect(PRICE_BREAKS).toHaveLength(6)
    for (let i = 1; i < PRICE_BREAKS.length; i += 1) {
      expect(PRICE_BREAKS[i]).toBeGreaterThan(PRICE_BREAKS[i - 1])
    }
  })

  it.each(BOROUGHS_2025)('$name: median lies inside the price filter bracket', (borough) => {
    expect(borough.median).toBeGreaterThanOrEqual(PRICE_FILTER.min)
    expect(borough.median).toBeLessThanOrEqual(PRICE_FILTER.max)
  })

  it('every neighbourhood clears the four-sale floor', () => {
    for (const row of NEIGHBORHOODS_2025) {
      expect(row.n).toBeGreaterThanOrEqual(4)
    }
  })

  it('neighbourhood counts sum to at most SNAPSHOT.points', () => {
    const total = NEIGHBORHOODS_2025.reduce((sum, row) => sum + row.n, 0)
    expect(total).toBeLessThanOrEqual(SNAPSHOT.points)
  })

  it('every non-null perSqFt is backed by at least four rows', () => {
    for (const row of NEIGHBORHOODS_2025) {
      if (row.perSqFt !== null) {
        expect(row.perSqFtRows).not.toBeNull()
        expect(row.perSqFtRows as number).toBeGreaterThanOrEqual(4)
      } else {
        expect(row.perSqFtRows).toBeNull()
      }
    }
  })

  it('SUNNYSIDE appears twice, once per borough, and the pair is unique by (borough, name)', () => {
    const sunnysides = NEIGHBORHOODS_2025.filter((row) => row.name === 'SUNNYSIDE')
    expect(sunnysides.length).toBeGreaterThanOrEqual(2)
    const keys = sunnysides.map((row) => `${row.b}:${row.name}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
