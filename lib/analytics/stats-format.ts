import type { BucketRow, SeriesPoint } from './stats-types'

function parseUTCDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`)
}

function formatUTCDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDaysUTC(day: string, delta: number): string {
  const date = parseUTCDate(day)
  date.setUTCDate(date.getUTCDate() + delta)
  return formatUTCDate(date)
}

/**
 * Zero-fills every day in [startDay, endDay] missing from `series`, preserving ascending
 * order. The Worker only ever returns a row for a day that actually had traffic, so a chart
 * that skipped this step would draw a shorter, misleading x axis on a quiet week.
 */
export function fillSeries(series: readonly SeriesPoint[], startDay: string, endDay: string): SeriesPoint[] {
  const byDay = new Map(series.map((point) => [point.day, point]))
  const out: SeriesPoint[] = []
  let day = startDay
  // The 5,000-day cap guards against a malformed or inverted range looping forever; the
  // dashboard never asks for a range longer than the site's own lifetime.
  for (let i = 0; day <= endDay && i < 5000; i += 1) {
    const existing = byDay.get(day)
    out.push(existing ?? { day, views: 0, visits: 0 })
    day = addDaysUTC(day, 1)
  }
  return out
}

/** The Monday, in UTC, of the ISO week `day` falls in. */
function isoWeekStart(day: string): string {
  const date = parseUTCDate(day)
  const isoWeekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (isoWeekday - 1))
  return formatUTCDate(date)
}

/**
 * Collapses a daily series into one point per ISO week, summed, keyed by that week's Monday.
 * Used once the 'all' window's series runs long enough that a bar per day stops being legible.
 */
export function bucketWeekly(series: readonly SeriesPoint[]): SeriesPoint[] {
  const byWeek = new Map<string, { views: number; visits: number }>()
  for (const point of series) {
    const week = isoWeekStart(point.day)
    const sums = byWeek.get(week) ?? { views: 0, visits: 0 }
    sums.views += point.views
    sums.visits += point.visits
    byWeek.set(week, sums)
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([day, sums]) => ({ day, views: sums.views, visits: sums.visits }))
}

/** e.g. 0 -> '0s', 95 -> '1m 35s', 3600 -> '60m 0s'. Whole seconds only, nothing rounds away. */
export function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}m ${remainder}s`
}

/** e.g. '/' -> 'Home', '/projects/nyc-home-sales-2025/' -> 'projects / nyc-home-sales-2025'. */
export function shortPath(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  if (trimmed === '') return 'Home'
  return trimmed.split('/').join(' / ')
}

/** Month-and-day tick label for a chart x axis, e.g. '2026-08-03' -> 'Aug 3'. */
const DAY_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function dayLabel(day: string): string {
  return DAY_LABEL_FORMAT.format(parseUTCDate(day))
}

/**
 * Bucket edges in seconds, matching migrations/0002_create_rollups.sql and the Worker's own
 * copy of this function exactly, so the two are never allowed to visibly disagree at a bucket
 * boundary. The open top bucket has no upper edge and returns its lower edge, labelled '>=' by
 * the caller.
 */
const BUCKET_EDGES: readonly (readonly [number, number | null])[] = [
  [0, 5],
  [5, 15],
  [15, 30],
  [30, 60],
  [60, 120],
  [120, 300],
  [300, null],
]

/** Linear interpolation of the median inside the bucket histogram. Null when every bucket is empty. */
export function estimateMedianFromBuckets(buckets: readonly BucketRow[]): number | null {
  const total = buckets.reduce((sum, bucket) => sum + bucket.n, 0)
  if (total === 0) return null

  const target = Math.floor((total + 1) / 2)
  let cumulative = 0
  for (const { bucket, n } of buckets) {
    const next = cumulative + n
    if (target <= next) {
      const [lo, hi] = BUCKET_EDGES[bucket]
      if (hi === null || n === 0) return lo
      const positionInBucket = (target - cumulative - 1) / n
      return Math.round(lo + positionInBucket * (hi - lo))
    }
    cumulative = next
  }
  return null
}
