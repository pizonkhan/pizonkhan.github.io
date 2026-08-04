import { addDaysUTC } from './rollup'
import type { BucketRow, ClickRow, DeviceRow, MedianKind, NamedRow, PageRow, SeriesPoint, StatsPayload, StatsWindow } from './types'

/**
 * Every query below splits its window at cutDay (rollup_state.last_rolled_day, or the
 * sentinel '0000-00-00' when nothing has been rolled yet): closed days come from the seven
 * daily_* tables, the tail after the cut comes from the raw event table. ?1 = startDay,
 * ?2 = endDay (today, UTC), ?3 = cutDay. The rollup side reads [startDay, cutDay]. The raw
 * side reads (max(cutDay, startDay - 1), endDay], enforced by binding both ?1 and ?3 on the
 * raw branch: if the rollup ever falls more than a day behind startDay, the extra ?1 >= bound
 * is what stops a raw scan from picking up days before the requested window.
 */

const BUCKET_CASE_INLINE = `CASE
           WHEN duration_s <   5 THEN 0
           WHEN duration_s <  15 THEN 1
           WHEN duration_s <  30 THEN 2
           WHEN duration_s <  60 THEN 3
           WHEN duration_s < 120 THEN 4
           WHEN duration_s < 300 THEN 5
           ELSE 6
         END`

const Q_SERIES = `
SELECT day, views, visits FROM daily_site
WHERE day >= ?1 AND day <= ?3
UNION ALL
SELECT day,
       SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END) AS views,
       COUNT(DISTINCT CASE WHEN kind = 'pageview' THEN visit_id END) AS visits
FROM event
WHERE env = 'prod' AND kind = 'pageview' AND day >= ?1 AND day > ?3 AND day <= ?2
GROUP BY day
ORDER BY day
`

const Q_TOTALS = `
SELECT
  (SELECT COALESCE(SUM(views), 0) FROM daily_site WHERE day >= ?1 AND day <= ?3)
  + (SELECT COUNT(*) FROM event WHERE env = 'prod' AND kind = 'pageview' AND day >= ?1 AND day > ?3 AND day <= ?2)
    AS views,
  (SELECT COALESCE(SUM(visits), 0) FROM daily_site WHERE day >= ?1 AND day <= ?3)
  + (SELECT COALESCE(SUM(v), 0) FROM (
       SELECT COUNT(DISTINCT visit_id) AS v FROM event
       WHERE env = 'prod' AND kind = 'pageview' AND day >= ?1 AND day > ?3 AND day <= ?2 GROUP BY day))
    AS visits,
  (SELECT COALESCE(SUM(clicks), 0) FROM daily_site WHERE day >= ?1 AND day <= ?3)
  + (SELECT COUNT(*) FROM event WHERE env = 'prod' AND kind = 'click' AND day >= ?1 AND day > ?3 AND day <= ?2)
    AS clicks,
  (SELECT COALESCE(SUM(duration_n), 0) FROM daily_site WHERE day >= ?1 AND day <= ?3)
  + (SELECT COUNT(*) FROM event WHERE env = 'prod' AND kind = 'duration' AND day >= ?1 AND day > ?3 AND day <= ?2)
    AS duration_n,
  (SELECT COALESCE(SUM(duration_sum_s), 0) FROM daily_site WHERE day >= ?1 AND day <= ?3)
  + (SELECT COALESCE(SUM(duration_s), 0) FROM event
     WHERE env = 'prod' AND kind = 'duration' AND day >= ?1 AND day > ?3 AND day <= ?2)
    AS duration_sum_s
`

const Q_MEDIAN_EXACT = `
WITH d AS (
  SELECT duration_s,
         ROW_NUMBER() OVER (ORDER BY duration_s) AS rn,
         COUNT(*)     OVER ()                    AS n
  FROM event
  WHERE env = 'prod' AND kind = 'duration' AND day >= ?1 AND day <= ?2
)
SELECT duration_s AS median_s FROM d WHERE rn = (n + 1) / 2
`

const Q_TOP_PAGES = `
WITH merged AS (
  SELECT path, views, visits, duration_n, duration_sum_s
  FROM daily_page WHERE day >= ?1 AND day <= ?3
  UNION ALL
  SELECT path,
         SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END),
         COUNT(DISTINCT CASE WHEN kind = 'pageview' THEN visit_id END),
         SUM(CASE WHEN kind = 'duration' THEN 1 ELSE 0 END),
         COALESCE(SUM(CASE WHEN kind = 'duration' THEN duration_s ELSE 0 END), 0)
  FROM event
  WHERE env = 'prod' AND day >= ?1 AND day > ?3 AND day <= ?2 AND kind IN ('pageview', 'duration')
  GROUP BY path
)
SELECT path,
       SUM(views)          AS views,
       SUM(visits)         AS visits,
       SUM(duration_n)     AS duration_n,
       SUM(duration_sum_s) AS duration_sum_s
FROM merged
GROUP BY path
ORDER BY views DESC, path ASC
LIMIT 8
`

const Q_MEDIAN_PER_PAGE = `
WITH d AS (
  SELECT path, duration_s,
         ROW_NUMBER() OVER (PARTITION BY path ORDER BY duration_s) AS rn,
         COUNT(*)     OVER (PARTITION BY path)                     AS n
  FROM event
  WHERE env = 'prod' AND kind = 'duration' AND day >= ?1 AND day <= ?2
)
SELECT path, duration_s AS median_s FROM d WHERE rn = (n + 1) / 2
`

const Q_BUCKETS_RAW = `
SELECT bucket, COUNT(*) AS n FROM (
  SELECT ${BUCKET_CASE_INLINE} AS bucket
  FROM event
  WHERE env = 'prod' AND kind = 'duration' AND day >= ?1 AND day <= ?2
)
GROUP BY bucket ORDER BY bucket
`

const Q_BUCKETS_ALL = `
SELECT bucket, SUM(n) AS n FROM (
  SELECT bucket, n FROM daily_duration_bucket WHERE day >= ?1 AND day <= ?3
  UNION ALL
  SELECT ${BUCKET_CASE_INLINE} AS bucket, 1 AS n
  FROM event WHERE env = 'prod' AND kind = 'duration' AND day >= ?1 AND day > ?3 AND day <= ?2
)
GROUP BY bucket ORDER BY bucket
`

const Q_TOP_CLICKS = `
WITH merged AS (
  SELECT path, section, target_kind, href, label, clicks
  FROM daily_click WHERE day >= ?1 AND day <= ?3
  UNION ALL
  SELECT path, COALESCE(section, 'unknown'), target_kind, href,
         COALESCE(label, ''), 1
  FROM event
  WHERE env = 'prod' AND kind = 'click' AND day >= ?1 AND day > ?3 AND day <= ?2
)
SELECT path, section, target_kind, href,
       COALESCE(MIN(label), '') AS label,
       SUM(clicks)              AS clicks
FROM merged
GROUP BY path, section, target_kind, href
ORDER BY clicks DESC, href ASC
LIMIT 10
`

const Q_DEVICES = `
WITH merged AS (
  SELECT device, browser, views FROM daily_device WHERE day >= ?1 AND day <= ?3
  UNION ALL
  SELECT COALESCE(device, 'unknown'), COALESCE(browser, 'other'), 1
  FROM event WHERE env = 'prod' AND kind = 'pageview' AND day >= ?1 AND day > ?3 AND day <= ?2
)
SELECT device, browser, SUM(views) AS views FROM merged
GROUP BY device, browser ORDER BY views DESC, device ASC LIMIT 10
`

const Q_REFERRERS = `
WITH merged AS (
  SELECT referrer_host AS name, views FROM daily_referrer WHERE day >= ?1 AND day <= ?3
  UNION ALL
  SELECT COALESCE(referrer_host, 'direct'), 1
  FROM event WHERE env = 'prod' AND kind = 'pageview' AND day >= ?1 AND day > ?3 AND day <= ?2
)
SELECT name, SUM(views) AS views FROM merged
GROUP BY name ORDER BY views DESC, name ASC LIMIT 8
`

const Q_COUNTRIES = `
WITH merged AS (
  SELECT country AS name, views FROM daily_country WHERE day >= ?1 AND day <= ?3
  UNION ALL
  SELECT COALESCE(country, 'XX'), 1
  FROM event WHERE env = 'prod' AND kind = 'pageview' AND day >= ?1 AND day > ?3 AND day <= ?2
)
SELECT name, SUM(views) AS views FROM merged
GROUP BY name ORDER BY views DESC, name ASC LIMIT 8
`

// Its own statement, so its own numbering: ?1 is endDay here, not startDay.
const Q_TODAY = `
SELECT
  COALESCE(SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END), 0)  AS views,
  COUNT(DISTINCT CASE WHEN kind = 'pageview' THEN visit_id END)    AS visits,
  COALESCE(SUM(CASE WHEN kind = 'click' THEN 1 ELSE 0 END), 0)     AS clicks
FROM event WHERE env = 'prod' AND kind IN ('pageview', 'click') AND day = ?1
`

const Q_PIPELINE = `
SELECT
  (SELECT last_rolled_day FROM rollup_state WHERE id = 1)              AS last_rolled_day,
  (SELECT last_run_at     FROM rollup_state WHERE id = 1)              AS last_run_at,
  (SELECT last_run_ms     FROM rollup_state WHERE id = 1)              AS last_run_ms,
  (SELECT COUNT(*)        FROM event WHERE env = 'prod')               AS raw_events,
  (SELECT COUNT(*)        FROM daily_site)                             AS rolled_days
`

interface SeriesRow { day: string; views: number; visits: number }
interface TotalsRow { views: number; visits: number; clicks: number; duration_n: number; duration_sum_s: number }
interface MedianRow { median_s: number }
interface PathMedianRow { path: string; median_s: number }
interface TopPageRow { path: string; views: number; visits: number; duration_n: number; duration_sum_s: number }
interface BucketRawRow { bucket: number; n: number }
interface TopClickRow { path: string; section: string; target_kind: string; href: string; label: string; clicks: number }
interface DeviceRawRow { device: string; browser: string; views: number }
interface NamedRawRow { name: string; views: number }
interface TodayRow { views: number; visits: number; clicks: number }
interface PipelineRow {
  last_rolled_day: string | null
  last_run_at: number | null
  last_run_ms: number | null
  raw_events: number
  rolled_days: number
}

const BUCKET_EDGES: readonly (readonly [number, number | null])[] = [
  [0, 5],
  [5, 15],
  [15, 30],
  [30, 60],
  [60, 120],
  [120, 300],
  [300, null],
]

/** Fills in every missing bucket 0 through 6 with n = 0, so the histogram always has 7 bars. */
function zeroFillBuckets(rows: readonly BucketRawRow[]): BucketRow[] {
  const counts = new Array(7).fill(0)
  for (const row of rows) {
    if (row.bucket >= 0 && row.bucket <= 6) counts[row.bucket] = row.n ?? 0
  }
  return counts.map((n, bucket) => ({ bucket, n }))
}

/**
 * The all-time median is never computed exactly: it is interpolated from the bucket
 * histogram using the same lower-of-two-middle-values convention as the exact query, so the
 * two never visibly disagree at a bucket boundary. The open top bucket returns exactly 300.
 */
function estimateMedianFromBuckets(buckets: readonly BucketRow[]): number | null {
  const total = buckets.reduce((sum, b) => sum + b.n, 0)
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

function windowBounds(window: StatsWindow, today: string): { startDay: string; endDay: string } {
  if (window === '7d') return { startDay: addDaysUTC(today, -6), endDay: today }
  if (window === '30d') return { startDay: addDaysUTC(today, -29), endDay: today }
  return { startDay: '0000-00-00', endDay: today }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Reads rollup_state.last_rolled_day, or the sentinel when nothing has been rolled yet. */
export async function readCutDay(db: D1Database): Promise<string> {
  const row = await db
    .prepare('SELECT last_rolled_day FROM rollup_state WHERE id = 1')
    .first<{ last_rolled_day: string | null }>()
  return row?.last_rolled_day ?? '0000-00-00'
}

export async function computeStats(db: D1Database, window: StatsWindow, now: number): Promise<StatsPayload> {
  const endDay = new Date(now).toISOString().slice(0, 10)
  const { startDay } = windowBounds(window, endDay)
  const cutDay = await readCutDay(db)

  const wantsExactMedian = window === '7d' || window === '30d'
  const bucketQuery = window === 'all' ? Q_BUCKETS_ALL : Q_BUCKETS_RAW

  const keys = [
    'series',
    'totals',
    'topPages',
    'buckets',
    'topClicks',
    'devices',
    'referrers',
    'countries',
    'today',
    'pipeline',
    ...(wantsExactMedian ? ['medianExact', 'medianPerPage'] : []),
  ] as const

  type QueryKey = (typeof keys)[number]

  // D1 requires the bind array to match the highest numbered placeholder each individual
  // statement actually references, not a fixed count shared across the batch. Q_TODAY has
  // its own ?1 (endDay). Q_MEDIAN_EXACT, Q_MEDIAN_PER_PAGE and the raw bucket query only go
  // up to ?2 (startDay, endDay). Q_PIPELINE takes no parameters at all.
  function queryAndParams(key: QueryKey): { text: string; params: readonly string[] } {
    switch (key) {
      case 'series':
        return { text: Q_SERIES, params: [startDay, endDay, cutDay] }
      case 'totals':
        return { text: Q_TOTALS, params: [startDay, endDay, cutDay] }
      case 'topPages':
        return { text: Q_TOP_PAGES, params: [startDay, endDay, cutDay] }
      case 'buckets':
        return {
          text: bucketQuery,
          params: window === 'all' ? [startDay, endDay, cutDay] : [startDay, endDay],
        }
      case 'topClicks':
        return { text: Q_TOP_CLICKS, params: [startDay, endDay, cutDay] }
      case 'devices':
        return { text: Q_DEVICES, params: [startDay, endDay, cutDay] }
      case 'referrers':
        return { text: Q_REFERRERS, params: [startDay, endDay, cutDay] }
      case 'countries':
        return { text: Q_COUNTRIES, params: [startDay, endDay, cutDay] }
      case 'today':
        return { text: Q_TODAY, params: [endDay] }
      case 'pipeline':
        return { text: Q_PIPELINE, params: [] }
      case 'medianExact':
        return { text: Q_MEDIAN_EXACT, params: [startDay, endDay] }
      case 'medianPerPage':
        return { text: Q_MEDIAN_PER_PAGE, params: [startDay, endDay] }
      default:
        throw new Error(`unhandled stats query key: ${String(key)}`)
    }
  }

  const statements = keys.map((key) => {
    const { text, params } = queryAndParams(key)
    const statement = db.prepare(text)
    return params.length > 0 ? statement.bind(...params) : statement
  })

  const results = await db.batch(statements)
  const byKey = new Map(keys.map((key, i) => [key, results[i]]))

  const seriesResult = byKey.get('series')!.results as SeriesRow[]
  const series: SeriesPoint[] = seriesResult.map((row) => ({
    day: row.day,
    views: row.views ?? 0,
    visits: row.visits ?? 0,
  }))

  const totalsRow = (byKey.get('totals')!.results as TotalsRow[])[0]
  const durationN = totalsRow?.duration_n ?? 0
  const durationSumS = totalsRow?.duration_sum_s ?? 0
  const avgSeconds = durationN > 0 ? round1(durationSumS / durationN) : null

  const bucketRows = zeroFillBuckets(byKey.get('buckets')!.results as BucketRawRow[])

  let medianSeconds: number | null = null
  let medianKind: MedianKind = 'none'
  if (wantsExactMedian) {
    const medianRow = (byKey.get('medianExact')!.results as MedianRow[])[0]
    if (medianRow) {
      medianSeconds = medianRow.median_s
      medianKind = 'exact'
    }
  } else {
    const estimate = estimateMedianFromBuckets(bucketRows)
    if (estimate !== null) {
      medianSeconds = estimate
      medianKind = 'estimated'
    }
  }

  const perPageMedian = new Map<string, number>()
  if (wantsExactMedian) {
    for (const row of byKey.get('medianPerPage')!.results as PathMedianRow[]) {
      perPageMedian.set(row.path, row.median_s)
    }
  }

  const topPages: PageRow[] = (byKey.get('topPages')!.results as TopPageRow[]).map((row) => {
    const rowDurationN = row.duration_n ?? 0
    return {
      path: row.path,
      views: row.views ?? 0,
      visits: row.visits ?? 0,
      avgSeconds: rowDurationN > 0 ? round1((row.duration_sum_s ?? 0) / rowDurationN) : null,
      medianSeconds: wantsExactMedian ? perPageMedian.get(row.path) ?? null : null,
    }
  })

  const topClicks: ClickRow[] = (byKey.get('topClicks')!.results as TopClickRow[]).map((row) => ({
    path: row.path,
    section: row.section,
    targetKind: row.target_kind,
    href: row.href,
    label: row.label ?? '',
    clicks: row.clicks ?? 0,
  }))

  const devices: DeviceRow[] = (byKey.get('devices')!.results as DeviceRawRow[]).map((row) => ({
    device: row.device,
    browser: row.browser,
    views: row.views ?? 0,
  }))

  const referrers: NamedRow[] = (byKey.get('referrers')!.results as NamedRawRow[]).map((row) => ({
    name: row.name,
    views: row.views ?? 0,
  }))

  const countries: NamedRow[] = (byKey.get('countries')!.results as NamedRawRow[]).map((row) => ({
    name: row.name,
    views: row.views ?? 0,
  }))

  const todayRow = (byKey.get('today')!.results as TodayRow[])[0]
  const pipelineRow = (byKey.get('pipeline')!.results as PipelineRow[])[0]

  return {
    v: 1,
    generatedAt: now,
    window,
    startDay,
    endDay,
    today: {
      day: endDay,
      views: todayRow?.views ?? 0,
      visits: todayRow?.visits ?? 0,
      clicks: todayRow?.clicks ?? 0,
    },
    totals: {
      views: totalsRow?.views ?? 0,
      visits: totalsRow?.visits ?? 0,
      clicks: totalsRow?.clicks ?? 0,
      avgSeconds,
      medianSeconds,
      medianKind,
    },
    series,
    topPages,
    topClicks,
    durationBuckets: bucketRows,
    devices,
    referrers,
    countries,
    pipeline: {
      lastRolledDay: pipelineRow?.last_rolled_day ?? null,
      lastRunAt: pipelineRow?.last_run_at ?? null,
      lastRunMs: pipelineRow?.last_run_ms ?? null,
      rawEvents: pipelineRow?.raw_events ?? 0,
      rolledDays: pipelineRow?.rolled_days ?? 0,
    },
  }
}
