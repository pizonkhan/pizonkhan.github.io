import { STATS_URL } from './config'
import type {
  BucketRow,
  ClickRow,
  DeviceRow,
  NamedRow,
  PageRow,
  SeriesPoint,
  StatsPayload,
  StatsWindow,
} from './stats-types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function fail(message: string): never {
  throw new Error(`invalid stats payload: ${message}`)
}

function parseSeriesPoint(row: unknown, index: number): SeriesPoint {
  if (!isRecord(row)) fail(`series[${index}] is not an object`)
  if (!isString(row.day)) fail(`series[${index}].day is not a string`)
  if (!isNumber(row.views)) fail(`series[${index}].views is not a number`)
  if (!isNumber(row.visits)) fail(`series[${index}].visits is not a number`)
  return { day: row.day, views: row.views, visits: row.visits }
}

function parsePageRow(row: unknown, index: number): PageRow {
  if (!isRecord(row)) fail(`topPages[${index}] is not an object`)
  if (!isString(row.path)) fail(`topPages[${index}].path is not a string`)
  if (!isNumber(row.views)) fail(`topPages[${index}].views is not a number`)
  if (!isNumber(row.visits)) fail(`topPages[${index}].visits is not a number`)
  if (!isNullableNumber(row.avgSeconds)) fail(`topPages[${index}].avgSeconds is invalid`)
  if (!isNullableNumber(row.medianSeconds)) fail(`topPages[${index}].medianSeconds is invalid`)
  return {
    path: row.path,
    views: row.views,
    visits: row.visits,
    avgSeconds: row.avgSeconds,
    medianSeconds: row.medianSeconds,
  }
}

function parseClickRow(row: unknown, index: number): ClickRow {
  if (!isRecord(row)) fail(`topClicks[${index}] is not an object`)
  if (!isString(row.path)) fail(`topClicks[${index}].path is not a string`)
  if (!isString(row.section)) fail(`topClicks[${index}].section is not a string`)
  if (!isString(row.targetKind)) fail(`topClicks[${index}].targetKind is not a string`)
  if (!isString(row.href)) fail(`topClicks[${index}].href is not a string`)
  if (!isString(row.label)) fail(`topClicks[${index}].label is not a string`)
  if (!isNumber(row.clicks)) fail(`topClicks[${index}].clicks is not a number`)
  return {
    path: row.path,
    section: row.section,
    targetKind: row.targetKind,
    href: row.href,
    label: row.label,
    clicks: row.clicks,
  }
}

function parseBucketRow(row: unknown, index: number): BucketRow {
  if (!isRecord(row)) fail(`durationBuckets[${index}] is not an object`)
  if (!isNumber(row.bucket)) fail(`durationBuckets[${index}].bucket is not a number`)
  if (!isNumber(row.n)) fail(`durationBuckets[${index}].n is not a number`)
  return { bucket: row.bucket, n: row.n }
}

function parseDeviceRow(row: unknown, index: number): DeviceRow {
  if (!isRecord(row)) fail(`devices[${index}] is not an object`)
  if (!isString(row.device)) fail(`devices[${index}].device is not a string`)
  if (!isString(row.browser)) fail(`devices[${index}].browser is not a string`)
  if (!isNumber(row.views)) fail(`devices[${index}].views is not a number`)
  return { device: row.device, browser: row.browser, views: row.views }
}

function parseNamedRow(row: unknown, index: number, field: string): NamedRow {
  if (!isRecord(row)) fail(`${field}[${index}] is not an object`)
  if (!isString(row.name)) fail(`${field}[${index}].name is not a string`)
  if (!isNumber(row.views)) fail(`${field}[${index}].views is not a number`)
  return { name: row.name, views: row.views }
}

/**
 * Throws rather than returning a best-effort shape: a malformed payload is a Worker defect, and
 * AnalyticsDashboard's error state is the honest way to surface that, not a dashboard quietly
 * rendering zeroes it made up.
 */
export function parseStats(input: unknown): StatsPayload {
  if (!isRecord(input)) fail('response is not an object')
  if (input.v !== 1) fail('v is not 1')
  if (!isNumber(input.generatedAt)) fail('generatedAt is not a number')
  if (input.window !== '7d' && input.window !== '30d' && input.window !== 'all') {
    fail('window is invalid')
  }
  if (!isString(input.startDay)) fail('startDay is not a string')
  if (!isString(input.endDay)) fail('endDay is not a string')

  if (!isRecord(input.today)) fail('today is not an object')
  if (!isString(input.today.day)) fail('today.day is not a string')
  if (!isNumber(input.today.views)) fail('today.views is not a number')
  if (!isNumber(input.today.visits)) fail('today.visits is not a number')
  if (!isNumber(input.today.clicks)) fail('today.clicks is not a number')

  if (!isRecord(input.totals)) fail('totals is not an object')
  if (!isNumber(input.totals.views)) fail('totals.views is not a number')
  if (!isNumber(input.totals.visits)) fail('totals.visits is not a number')
  if (!isNumber(input.totals.clicks)) fail('totals.clicks is not a number')
  if (!isNullableNumber(input.totals.avgSeconds)) fail('totals.avgSeconds is invalid')
  if (!isNullableNumber(input.totals.medianSeconds)) fail('totals.medianSeconds is invalid')
  if (
    input.totals.medianKind !== 'exact' &&
    input.totals.medianKind !== 'estimated' &&
    input.totals.medianKind !== 'none'
  ) {
    fail('totals.medianKind is invalid')
  }

  if (!Array.isArray(input.series)) fail('series is not an array')
  if (!Array.isArray(input.topPages)) fail('topPages is not an array')
  if (!Array.isArray(input.topClicks)) fail('topClicks is not an array')
  if (!Array.isArray(input.durationBuckets)) fail('durationBuckets is not an array')
  if (!Array.isArray(input.devices)) fail('devices is not an array')
  if (!Array.isArray(input.referrers)) fail('referrers is not an array')
  if (!Array.isArray(input.countries)) fail('countries is not an array')

  if (!isRecord(input.pipeline)) fail('pipeline is not an object')
  const pipeline = input.pipeline
  if (pipeline.lastRolledDay !== null && !isString(pipeline.lastRolledDay)) {
    fail('pipeline.lastRolledDay is invalid')
  }
  if (!isNullableNumber(pipeline.lastRunAt)) fail('pipeline.lastRunAt is invalid')
  if (!isNullableNumber(pipeline.lastRunMs)) fail('pipeline.lastRunMs is invalid')
  if (!isNumber(pipeline.rawEvents)) fail('pipeline.rawEvents is not a number')
  if (!isNumber(pipeline.rolledDays)) fail('pipeline.rolledDays is not a number')

  return {
    v: 1,
    generatedAt: input.generatedAt,
    window: input.window,
    startDay: input.startDay,
    endDay: input.endDay,
    today: {
      day: input.today.day,
      views: input.today.views,
      visits: input.today.visits,
      clicks: input.today.clicks,
    },
    totals: {
      views: input.totals.views,
      visits: input.totals.visits,
      clicks: input.totals.clicks,
      avgSeconds: input.totals.avgSeconds,
      medianSeconds: input.totals.medianSeconds,
      medianKind: input.totals.medianKind,
    },
    series: input.series.map((row, index) => parseSeriesPoint(row, index)),
    topPages: input.topPages.map((row, index) => parsePageRow(row, index)),
    topClicks: input.topClicks.map((row, index) => parseClickRow(row, index)),
    durationBuckets: input.durationBuckets.map((row, index) => parseBucketRow(row, index)),
    devices: input.devices.map((row, index) => parseDeviceRow(row, index)),
    referrers: input.referrers.map((row, index) => parseNamedRow(row, index, 'referrers')),
    countries: input.countries.map((row, index) => parseNamedRow(row, index, 'countries')),
    pipeline: {
      lastRolledDay: pipeline.lastRolledDay,
      lastRunAt: pipeline.lastRunAt,
      lastRunMs: pipeline.lastRunMs,
      rawEvents: pipeline.rawEvents,
      rolledDays: pipeline.rolledDays,
    },
  }
}

/**
 * The dashboard's one network call. STATS_URL is empty in an unconfigured build, so this is
 * only ever invoked once AnalyticsDashboard has already confirmed it is non-empty; callers
 * still get a clear rejection if it is not, rather than a request to a bare "?window=" path.
 */
export async function fetchStats(window: StatsWindow, options?: { signal?: AbortSignal }): Promise<StatsPayload> {
  if (!STATS_URL) throw new Error('analytics endpoint is not configured')
  const response = await fetch(`${STATS_URL}?window=${window}`, {
    signal: options?.signal,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`stats request failed with status ${response.status}`)
  const body: unknown = await response.json()
  return parseStats(body)
}
