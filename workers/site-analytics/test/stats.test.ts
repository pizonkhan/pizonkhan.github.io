import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRollupStatements } from '../src/rollup'
import { computeStats } from '../src/stats'
import worker from '../src/index'

const TODAY_ISO = '2026-08-04T09:00:00.000Z'
const TODAY = '2026-08-04'
const D1 = '2026-08-01'

const ROLLUP_TABLES = [
  'daily_site',
  'daily_page',
  'daily_referrer',
  'daily_device',
  'daily_country',
  'daily_click',
  'daily_duration_bucket',
] as const

let pageviewSeed = 0
async function seedPageview(day: string, path: string, visit: string): Promise<void> {
  pageviewSeed += 1
  await env.DB.prepare(
    `INSERT INTO event (event_id, ts, day, env, kind, visit_id, path, referrer_host, device, browser, country)
     VALUES (?1, ?2, ?3, 'prod', 'pageview', ?4, ?5, 'direct', 'desktop', 'chrome', 'US')`,
  )
    .bind(`pv${pageviewSeed}`.padStart(32, '0'), Date.parse(`${day}T10:00:00.000Z`), day, visit, path)
    .run()
}

let clickSeed = 0
async function seedClick(
  day: string,
  path: string,
  section: string,
  targetKind: string,
  href: string,
  label: string,
): Promise<void> {
  clickSeed += 1
  await env.DB.prepare(
    `INSERT INTO event (event_id, ts, day, env, kind, visit_id, path, section, target_kind, href, label)
     VALUES (?1, ?2, ?3, 'prod', 'click', 'visit-click', ?4, ?5, ?6, ?7, ?8)`,
  )
    .bind(`ck${clickSeed}`.padStart(32, '0'), Date.parse(`${day}T10:00:00.000Z`), day, path, section, targetKind, href, label)
    .run()
}

let durationSeed = 0
async function seedDuration(day: string, path: string, seconds: number): Promise<void> {
  durationSeed += 1
  await env.DB.prepare(
    `INSERT INTO event (event_id, ts, day, env, kind, visit_id, path, duration_s)
     VALUES (?1, ?2, ?3, 'prod', 'duration', 'visit-dur', ?4, ?5)`,
  )
    .bind(`du${durationSeed}`.padStart(32, '0'), Date.parse(`${day}T10:00:00.000Z`), day, path, seconds)
    .run()
}

async function clearAll(): Promise<void> {
  await env.DB.exec('DELETE FROM event')
  for (const table of ROLLUP_TABLES) {
    await env.DB.exec(`DELETE FROM ${table}`)
  }
  await env.DB.exec(
    'UPDATE rollup_state SET last_rolled_day = NULL, last_run_at = NULL, last_run_ms = NULL, last_run_rows = NULL WHERE id = 1',
  )
}

beforeEach(async () => {
  pageviewSeed = 0
  clickSeed = 0
  durationSeed = 0
  await clearAll()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(TODAY_ISO))
})

afterEach(() => {
  vi.useRealTimers()
})

/** The shared fixture used by criteria 30, 31 and 33: a known day plus a lighter "today". */
async function seedFixture(): Promise<void> {
  // D1: two visits view /projects/ (one of them twice), one visit views /experience/.
  await seedPageview(D1, '/projects/', 'visit-a')
  await seedPageview(D1, '/projects/', 'visit-a')
  await seedPageview(D1, '/projects/', 'visit-b')
  await seedPageview(D1, '/experience/', 'visit-c')

  await seedClick(D1, '/projects/', 'hero', 'outbound', 'https://example.com/a', 'Example A')
  await seedClick(D1, '/projects/', 'hero', 'outbound', 'https://example.com/a', 'Example A')
  await seedClick(D1, '/experience/', 'footer', 'internal', '/business/', 'Business')

  // One duration reading in each of the seven buckets, all on /projects/.
  for (const seconds of [2, 10, 20, 45, 90, 200, 400]) {
    await seedDuration(D1, '/projects/', seconds)
  }

  // Today: a smaller, disjoint page and click, so D1 stays the clear top-page/top-click.
  await seedPageview(TODAY, '/business/', 'visit-d')
  await seedClick(TODAY, '/business/', 'hero', 'anchor', '#models', 'Models')
}

describe('computeStats: window=7d', () => {
  it('returns the exact totals, today, topPages[0], topClicks[0], all seven buckets and the exact median', async () => {
    await seedFixture()
    const payload = await computeStats(env.DB, '7d', Date.now())

    expect(payload.totals.views).toBe(5)
    expect(payload.totals.visits).toBe(4)
    expect(payload.totals.clicks).toBe(4)
    expect(payload.totals.avgSeconds).toBeCloseTo(767 / 7, 1)
    expect(payload.totals.medianSeconds).toBe(45)
    expect(payload.totals.medianKind).toBe('exact')

    expect(payload.today).toEqual({ day: TODAY, views: 1, visits: 1, clicks: 1 })

    expect(payload.topPages[0]).toEqual({
      path: '/projects/',
      views: 3,
      visits: 2,
      avgSeconds: expect.closeTo(767 / 7, 1),
      medianSeconds: 45,
    })

    expect(payload.topClicks[0]).toEqual({
      path: '/projects/',
      section: 'hero',
      targetKind: 'outbound',
      href: 'https://example.com/a',
      label: 'Example A',
      clicks: 2,
    })

    expect(payload.durationBuckets).toEqual([
      { bucket: 0, n: 1 },
      { bucket: 1, n: 1 },
      { bucket: 2, n: 1 },
      { bucket: 3, n: 1 },
      { bucket: 4, n: 1 },
      { bucket: 5, n: 1 },
      { bucket: 6, n: 1 },
    ])
  })

  it('returns numbers identical before and after the fixture day is rolled up', async () => {
    await seedFixture()
    const before = await computeStats(env.DB, '7d', Date.now())

    await env.DB.batch(buildRollupStatements(env.DB, D1))
    await env.DB.prepare('UPDATE rollup_state SET last_rolled_day = ?1 WHERE id = 1').bind(D1).run()

    const after = await computeStats(env.DB, '7d', Date.now())
    // pipeline legitimately changes: rolling a day forward is what this test just did.
    const { pipeline: beforePipeline, ...beforeRest } = before
    const { pipeline: afterPipeline, ...afterRest } = after
    expect(afterRest).toEqual(beforeRest)
    expect(afterPipeline.lastRolledDay).toBe(D1)
    expect(beforePipeline.lastRolledDay).toBeNull()
  })

  it('picks the lower of the two middle values when there is an even number of readings', async () => {
    for (const seconds of [10, 20, 30, 40]) {
      await seedDuration(D1, '/projects/', seconds)
    }
    const payload = await computeStats(env.DB, '7d', Date.now())
    expect(payload.totals.medianSeconds).toBe(20)
    expect(payload.totals.medianKind).toBe('exact')
  })
})

describe('computeStats: window=all', () => {
  it('estimates the median from the bucket histogram, landing in the bucket containing the true median', async () => {
    await seedFixture()
    const payload = await computeStats(env.DB, 'all', Date.now())
    expect(payload.totals.medianKind).toBe('estimated')
    // The true median over the seven seeded readings is 45, which falls in the 30-60 bucket.
    expect(payload.totals.medianSeconds).not.toBeNull()
    expect(payload.totals.medianSeconds as number).toBeGreaterThanOrEqual(30)
    expect(payload.totals.medianSeconds as number).toBeLessThan(60)
  })
})

async function statsRequest(window: string): Promise<Response> {
  const request = new Request(`https://worker.example/stats?window=${window}`)
  const ctx = createExecutionContext()
  const response = await worker.fetch(request, env, ctx)
  await waitOnExecutionContext(ctx)
  return response
}

describe('GET /stats', () => {
  it('rejects an unsupported window with 400', async () => {
    const response = await statsRequest('90d')
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'invalid_window' })
  })

  it('returns every count zero on an empty database, with durationBuckets zero-filled and no unexpected nulls', async () => {
    const response = await statsRequest('7d')
    expect(response.status).toBe(200)
    const payload = (await response.json()) as Record<string, unknown>

    const totals = payload.totals as Record<string, unknown>
    expect(totals.views).toBe(0)
    expect(totals.visits).toBe(0)
    expect(totals.clicks).toBe(0)
    expect(totals.avgSeconds).toBeNull()
    expect(totals.medianSeconds).toBeNull()
    expect(totals.medianKind).toBe('none')

    expect(payload.series).toEqual([])
    expect(payload.topPages).toEqual([])
    expect(payload.topClicks).toEqual([])
    expect(payload.devices).toEqual([])
    expect(payload.referrers).toEqual([])
    expect(payload.countries).toEqual([])
    expect(payload.durationBuckets).toHaveLength(7)
    expect((payload.durationBuckets as { n: number }[]).every((b) => b.n === 0)).toBe(true)

    const today = payload.today as Record<string, unknown>
    expect(today.views).toBe(0)
    expect(today.visits).toBe(0)
    expect(today.clicks).toBe(0)
  })

  it('returns exactly the StatsPayload key set', async () => {
    const response = await statsRequest('all')
    const payload = (await response.json()) as Record<string, unknown>
    expect(new Set(Object.keys(payload))).toEqual(
      new Set([
        'v',
        'generatedAt',
        'window',
        'startDay',
        'endDay',
        'today',
        'totals',
        'series',
        'topPages',
        'topClicks',
        'durationBuckets',
        'devices',
        'referrers',
        'countries',
        'pipeline',
      ]),
    )
  })
})
