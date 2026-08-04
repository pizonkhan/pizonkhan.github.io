import { classifyOrigin, corsHeaders, parseAllowedOrigins } from './cors'
import { buildInsertStatements } from './insert'
import { buildRollupStatements, buildRollupStateUpsert, computeRollupDays, utcDay } from './rollup'
import { computeStats } from './stats'
import type { Env, RateLimit, RequestContext, StatsWindow } from './types'
import { classifyBrowser, classifyDevice, isBot } from './ua'
import { validateCollectBody } from './validate'

const MAX_BODY_BYTES = 8192
const STATS_TTL_MS = 60_000

/** Isolate-local memoisation of /stats responses, 60 seconds, keyed by window. The Cache API
 * is deliberately not used: its behaviour on *.workers.dev hostnames is not something this
 * design should depend on. */
const statsCache = new Map<StatsWindow, { body: string; expiresAt: number }>()

/** Per-isolate fallback when IP_SALT is not configured as a secret. Random per cold start. */
let isolateSalt: string | null = null

function saltFor(env: Env): string {
  if (env.IP_SALT) return env.IP_SALT
  if (!isolateSalt) isolateSalt = crypto.randomUUID()
  return isolateSalt
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** SHA-256(ip + salt + currentUtcDay), truncated. Keys for the same IP are unlinkable across
 * days, and the IP itself is never persisted: this key is used for the request and discarded. */
async function rateLimitKey(ip: string, salt: string, day: string): Promise<string> {
  const data = new TextEncoder().encode(`${ip}:${salt}:${day}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  return hex.slice(0, 32)
}

async function checkRateLimit(limiter: RateLimit | undefined, request: Request, env: Env): Promise<boolean> {
  if (!limiter) return true
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const key = await rateLimitKey(ip, saltFor(env), utcDay(Date.now()))
  const result = await limiter.limit({ key })
  return result.success
}

function jsonResponse(body: unknown, status: number, headers?: Headers): Response {
  const responseHeaders = headers ?? new Headers()
  responseHeaders.set('content-type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

async function handleOptions(request: Request, env: Env): Promise<Response> {
  const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS)
  const origin = request.headers.get('origin')
  const { allowed: isAllowed } = classifyOrigin(origin, allowed)
  if (!isAllowed) return jsonResponse({ error: 'not_found' }, 404)

  const headers = corsHeaders(origin, allowed)
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS')
  headers.set('access-control-allow-headers', 'content-type')
  headers.set('access-control-max-age', '86400')
  return new Response(null, { status: 204, headers })
}

async function handleCollect(request: Request, env: Env): Promise<Response> {
  const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS)
  const origin = request.headers.get('origin')
  const { allowed: originAllowed, env: siteEnv } = classifyOrigin(origin, allowed)
  if (!originAllowed || !siteEnv) {
    return jsonResponse({ error: 'origin_not_allowed' }, 403)
  }

  const withinLimit = await checkRateLimit(env.RL_COLLECT, request, env)
  if (!withinLimit) {
    const headers = corsHeaders(origin, allowed)
    headers.set('retry-after', '60')
    return jsonResponse({ error: 'rate_limited' }, 429, headers)
  }

  const headers = corsHeaders(origin, allowed)
  headers.set('cache-control', 'no-store')

  const rawBody = await request.text()
  if (byteLength(rawBody) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'payload_too_large' }, 413, headers)
  }

  const result = validateCollectBody(rawBody, origin as string)
  if (!result.ok) {
    return jsonResponse({ error: result.error, detail: result.detail }, 400, headers)
  }

  const userAgent = request.headers.get('user-agent') ?? ''
  if (isBot(userAgent)) {
    headers.set('x-pk-ingest', 'dropped-bot')
    headers.set('x-pk-ingest-count', '0')
    return new Response(null, { status: 204, headers })
  }

  const ts = Date.now()
  const cf = (request as Request & { cf?: { country?: string } }).cf
  const ctx: RequestContext = {
    ts,
    day: utcDay(ts),
    env: siteEnv,
    device: classifyDevice({
      userAgent,
      secChUaMobile: request.headers.get('sec-ch-ua-mobile') ?? undefined,
    }),
    browser: classifyBrowser(userAgent),
    country: cf?.country ?? 'XX',
  }

  const statements = buildInsertStatements(env.DB, result.events, ctx)
  await env.DB.batch(statements)

  headers.set('x-pk-ingest', 'stored')
  headers.set('x-pk-ingest-count', String(result.events.length))
  return new Response(null, { status: 204, headers })
}

function isStatsWindow(value: string | null): value is StatsWindow {
  return value === '7d' || value === '30d' || value === 'all'
}

async function handleStats(request: Request, env: Env, url: URL): Promise<Response> {
  const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS)
  const origin = request.headers.get('origin')

  if (origin) {
    const { allowed: originAllowed } = classifyOrigin(origin, allowed)
    if (!originAllowed) return jsonResponse({ error: 'origin_not_allowed' }, 403)
  }

  const windowParam = url.searchParams.get('window')
  if (!isStatsWindow(windowParam)) {
    return jsonResponse({ error: 'invalid_window' }, 400, corsHeaders(origin, allowed))
  }

  const withinLimit = await checkRateLimit(env.RL_STATS, request, env)
  if (!withinLimit) {
    const headers = corsHeaders(origin, allowed)
    headers.set('retry-after', '60')
    return jsonResponse({ error: 'rate_limited' }, 429, headers)
  }

  const now = Date.now()
  const cached = statsCache.get(windowParam)
  let body: string
  if (cached && cached.expiresAt > now) {
    body = cached.body
  } else {
    const payload = await computeStats(env.DB, windowParam, now)
    body = JSON.stringify(payload)
    statsCache.set(windowParam, { body, expiresAt: now + STATS_TTL_MS })
  }

  const headers = corsHeaders(origin, allowed)
  headers.set('cache-control', 'public, max-age=60')
  headers.set('content-type', 'application/json')
  return new Response(body, { status: 200, headers })
}

interface HealthRow {
  last_rolled_day: string | null
  last_run_at: number | null
  last_run_ms: number | null
  events_prod: number
  events_dev: number
  rolled_days: number
}

async function handleHealth(env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      `SELECT
         (SELECT last_rolled_day FROM rollup_state WHERE id = 1)  AS last_rolled_day,
         (SELECT last_run_at     FROM rollup_state WHERE id = 1)  AS last_run_at,
         (SELECT last_run_ms     FROM rollup_state WHERE id = 1)  AS last_run_ms,
         (SELECT COUNT(*) FROM event WHERE env = 'prod')          AS events_prod,
         (SELECT COUNT(*) FROM event WHERE env = 'dev')           AS events_dev,
         (SELECT COUNT(*) FROM daily_site)                        AS rolled_days`,
    ).first<HealthRow>()

    return jsonResponse(
      {
        ok: true,
        v: 1,
        now: Date.now(),
        db: 'up',
        lastRolledDay: row?.last_rolled_day ?? null,
        lastRunAt: row?.last_run_at ?? null,
        lastRunMs: row?.last_run_ms ?? null,
        eventsProd: row?.events_prod ?? 0,
        eventsDev: row?.events_dev ?? 0,
        rolledDays: row?.rolled_days ?? 0,
      },
      200,
    )
  } catch {
    return jsonResponse({ ok: false, v: 1, now: Date.now(), db: 'down' }, 200)
  }
}

/** Runs the catch-up rollup described in computeRollupDays, oldest day first. */
export async function runRollup(env: Env): Promise<void> {
  const start = Date.now()
  const today = utcDay(start)

  const state = await env.DB.prepare('SELECT last_rolled_day FROM rollup_state WHERE id = 1').first<{
    last_rolled_day: string | null
  }>()
  const lastRolledDay = state?.last_rolled_day ?? null

  const days = computeRollupDays(lastRolledDay, today)
  if (days.length === 0) return

  for (const day of days) {
    await env.DB.batch(buildRollupStatements(env.DB, day))
  }

  const rowsCounted = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM event WHERE env = 'prod' AND day >= ?1 AND day <= ?2`,
  )
    .bind(days[0], days[days.length - 1])
    .first<{ n: number }>()

  const runMs = Date.now() - start
  await buildRollupStateUpsert(env.DB, days[days.length - 1], Date.now(), runMs, rowsCounted?.n ?? 0).run()
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return handleOptions(request, env)
    if (url.pathname === '/health' && request.method === 'GET') return handleHealth(env)
    if (url.pathname === '/collect' && request.method === 'POST') return handleCollect(request, env)
    if (url.pathname === '/stats' && request.method === 'GET') return handleStats(request, env, url)

    return jsonResponse({ error: 'not_found' }, 404)
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await runRollup(env)
  },
}
