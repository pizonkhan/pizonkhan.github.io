/**
 * The site's copy of the Worker's response shape. Duplicated on purpose, not imported: pulling
 * from workers/site-analytics would drag its tsconfig into the site's type graph, which the
 * root tooling exclusion exists to prevent. Keep this in lockstep with
 * workers/site-analytics/src/types.ts by hand; stats-client.test.ts and the Worker's own
 * stats.test.ts both guard the shape from their own side of the boundary.
 */

export type StatsWindow = '7d' | '30d' | 'all'
export type MedianKind = 'exact' | 'estimated' | 'none'

export interface SeriesPoint {
  day: string
  views: number
  visits: number
}

export interface PageRow {
  path: string
  views: number
  visits: number
  avgSeconds: number | null
  medianSeconds: number | null
}

export interface ClickRow {
  path: string
  section: string
  targetKind: string
  href: string
  label: string
  clicks: number
}

export interface BucketRow {
  bucket: number
  n: number
}

export interface DeviceRow {
  device: string
  browser: string
  views: number
}

export interface NamedRow {
  name: string
  views: number
}

export interface StatsPayload {
  v: 1
  generatedAt: number
  window: StatsWindow
  startDay: string
  endDay: string
  today: { day: string; views: number; visits: number; clicks: number }
  totals: {
    views: number
    visits: number
    clicks: number
    avgSeconds: number | null
    medianSeconds: number | null
    medianKind: MedianKind
  }
  series: SeriesPoint[]
  topPages: PageRow[]
  topClicks: ClickRow[]
  durationBuckets: BucketRow[]
  devices: DeviceRow[]
  referrers: NamedRow[]
  countries: NamedRow[]
  pipeline: {
    lastRolledDay: string | null
    lastRunAt: number | null
    lastRunMs: number | null
    rawEvents: number
    rolledDays: number
  }
}
