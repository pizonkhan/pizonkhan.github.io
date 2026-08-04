import { describe, expect, it } from 'vitest'
import {
  bucketWeekly,
  estimateMedianFromBuckets,
  fillSeries,
  formatSeconds,
  shortPath,
} from './stats-format'
import type { BucketRow, SeriesPoint } from './stats-types'

describe('fillSeries', () => {
  it('inserts zero entries for every missing day in the range and preserves order', () => {
    const series: SeriesPoint[] = [
      { day: '2026-08-01', views: 4, visits: 3 },
      { day: '2026-08-03', views: 2, visits: 2 },
    ]
    expect(fillSeries(series, '2026-08-01', '2026-08-04')).toEqual([
      { day: '2026-08-01', views: 4, visits: 3 },
      { day: '2026-08-02', views: 0, visits: 0 },
      { day: '2026-08-03', views: 2, visits: 2 },
      { day: '2026-08-04', views: 0, visits: 0 },
    ])
  })

  it('returns an empty array when startDay is after endDay', () => {
    expect(fillSeries([], '2026-08-05', '2026-08-01')).toEqual([])
  })
})

describe('bucketWeekly', () => {
  it('collapses 70 days into 10 weekly points with correct sums', () => {
    // 2026-06-01 is a Monday, so 70 consecutive days from it split into exactly 10 full weeks.
    const series: SeriesPoint[] = []
    let day = new Date('2026-06-01T00:00:00Z')
    for (let i = 0; i < 70; i += 1) {
      series.push({ day: day.toISOString().slice(0, 10), views: 1, visits: 1 })
      day = new Date(day.getTime() + 86_400_000)
    }

    const weekly = bucketWeekly(series)
    expect(weekly).toHaveLength(10)
    for (const point of weekly) {
      expect(point.views).toBe(7)
      expect(point.visits).toBe(7)
    }
    expect(weekly[0].day).toBe('2026-06-01')
    expect(weekly[9].day).toBe('2026-08-03')
  })
})

describe('formatSeconds', () => {
  it('renders whole seconds under a minute plainly', () => {
    expect(formatSeconds(0)).toBe('0s')
    expect(formatSeconds(9)).toBe('9s')
  })

  it('renders a minute and a half as 1m 35s', () => {
    expect(formatSeconds(95)).toBe('1m 35s')
  })

  it('renders the clamp ceiling as 60m 0s', () => {
    expect(formatSeconds(3600)).toBe('60m 0s')
  })
})

describe('shortPath', () => {
  it('renders the root path as Home', () => {
    expect(shortPath('/')).toBe('Home')
  })

  it('renders a nested path with slashes as separators', () => {
    expect(shortPath('/projects/nyc-home-sales-2025/')).toBe('projects / nyc-home-sales-2025')
  })
})

describe('estimateMedianFromBuckets', () => {
  it('returns a value inside the correct bucket for a known histogram', () => {
    // 20 readings in bucket 3 (30-60s), everything else empty: the median must fall in [30, 60).
    const buckets: BucketRow[] = [0, 1, 2, 3, 4, 5, 6].map((bucket) => ({
      bucket,
      n: bucket === 3 ? 20 : 0,
    }))
    const estimate = estimateMedianFromBuckets(buckets)
    expect(estimate).not.toBeNull()
    expect(estimate as number).toBeGreaterThanOrEqual(30)
    expect(estimate as number).toBeLessThan(60)
  })

  it('returns null for an all-zero histogram', () => {
    const buckets: BucketRow[] = [0, 1, 2, 3, 4, 5, 6].map((bucket) => ({ bucket, n: 0 }))
    expect(estimateMedianFromBuckets(buckets)).toBeNull()
  })

  it('returns the open lower edge for a median that falls in the top bucket', () => {
    const buckets: BucketRow[] = [0, 1, 2, 3, 4, 5, 6].map((bucket) => ({
      bucket,
      n: bucket === 6 ? 5 : 0,
    }))
    expect(estimateMedianFromBuckets(buckets)).toBe(300)
  })
})
