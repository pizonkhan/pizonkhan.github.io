import { describe, expect, it } from 'vitest'
import { parseStats } from './stats-client'
import type { StatsPayload } from './stats-types'

const VALID: StatsPayload = {
  v: 1,
  generatedAt: 1754179200000,
  window: '7d',
  startDay: '2026-07-28',
  endDay: '2026-08-03',
  today: { day: '2026-08-03', views: 4, visits: 3, clicks: 1 },
  totals: {
    views: 41,
    visits: 17,
    clicks: 9,
    avgSeconds: 76.7,
    medianSeconds: 62,
    medianKind: 'exact',
  },
  series: [{ day: '2026-08-03', views: 4, visits: 3 }],
  topPages: [
    {
      path: '/projects/nyc-home-sales-2025/',
      views: 14,
      visits: 11,
      avgSeconds: 107.8,
      medianSeconds: 62,
    },
  ],
  topClicks: [
    {
      path: '/projects/nyc-home-sales-2025/',
      section: 'project-meta',
      targetKind: 'outbound',
      href: 'https://data.cityofnewyork.us/City-Government/NYC-Citywide',
      label: 'NYC Department of Finance',
      clicks: 3,
    },
  ],
  durationBuckets: [0, 1, 2, 3, 4, 5, 6].map((bucket) => ({ bucket, n: bucket === 4 ? 11 : 0 })),
  devices: [{ device: 'desktop', browser: 'chrome', views: 23 }],
  referrers: [{ name: 'linkedin.com', views: 12 }],
  countries: [{ name: 'US', views: 34 }],
  pipeline: {
    lastRolledDay: '2026-08-02',
    lastRunAt: 1754179020000,
    lastRunMs: 88,
    rawEvents: 128,
    rolledDays: 12,
  },
}

describe('parseStats', () => {
  it('accepts a valid payload unchanged', () => {
    expect(parseStats(VALID)).toEqual(VALID)
  })

  it('throws on a missing key', () => {
    const withoutPipeline: Partial<StatsPayload> = { ...VALID }
    delete withoutPipeline.pipeline
    expect(() => parseStats(withoutPipeline)).toThrow()
  })

  it('throws on a wrong-typed totals.views', () => {
    const broken = { ...VALID, totals: { ...VALID.totals, views: '41' } }
    expect(() => parseStats(broken)).toThrow()
  })

  it('throws when series is not an array', () => {
    const broken = { ...VALID, series: 'not an array' }
    expect(() => parseStats(broken)).toThrow()
  })

  it('throws when v is not 1', () => {
    const broken = { ...VALID, v: 2 }
    expect(() => parseStats(broken)).toThrow()
  })

  it('throws on a non-object response', () => {
    expect(() => parseStats(null)).toThrow()
    expect(() => parseStats('nope')).toThrow()
  })
})
