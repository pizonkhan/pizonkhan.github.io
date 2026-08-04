/**
 * Cloudflare's Rate Limiting binding. Declared locally rather than imported: the installed
 * @cloudflare/workers-types version this Worker builds against does not ship it as a named
 * export, only as an ambient global, and this keeps the shape explicit either way.
 */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  DB: D1Database
  /** Comma-separated allowlist, from wrangler.jsonc vars. */
  ALLOWED_ORIGINS: string
  /** Optional secret. When absent the Worker falls back to a per-isolate random salt. */
  IP_SALT?: string
  /** Optional. When the binding is absent, every request is allowed. */
  RL_COLLECT?: RateLimit
  RL_STATS?: RateLimit
}

export type EventKind = 'pageview' | 'click' | 'duration'
export type TargetKind = 'internal' | 'outbound' | 'anchor' | 'mailto' | 'download'
export type SiteEnv = 'prod' | 'dev'

export type ClientEvent =
  | { id: string; visit: string; kind: 'pageview'; path: string; ref?: string }
  | {
      id: string
      visit: string
      kind: 'click'
      path: string
      targetKind: TargetKind
      href: string
      section?: string
      label?: string
    }
  | { id: string; visit: string; kind: 'duration'; path: string; seconds: number }

export interface CollectBody {
  v: 1
  events: ClientEvent[]
}

export interface RequestContext {
  ts: number
  day: string
  env: SiteEnv
  device: string
  browser: string
  country: string
}

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
