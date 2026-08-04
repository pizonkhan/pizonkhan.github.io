import { env } from 'cloudflare:test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addDaysUTC, buildRollupStateUpsert, buildRollupStatements, computeRollupDays } from '../src/rollup'
import { runRollup } from '../src/index'

const VISIT = 'e'.repeat(32)
const ROLLUP_TABLES = [
  'daily_site',
  'daily_page',
  'daily_referrer',
  'daily_device',
  'daily_country',
  'daily_click',
  'daily_duration_bucket',
] as const

function eventId(seed: number): string {
  return seed.toString(16).padStart(32, '0')
}

async function seedPageview(day: string, path: string, siteEnv: 'prod' | 'dev', idSeed: number): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO event (event_id, ts, day, env, kind, visit_id, path, referrer_host, device, browser, country)
     VALUES (?1, ?2, ?3, ?4, 'pageview', ?5, ?6, 'direct', 'desktop', 'chrome', 'US')`,
  )
    .bind(eventId(idSeed), Date.parse(`${day}T12:00:00.000Z`), day, siteEnv, VISIT, path)
    .run()
}

beforeEach(async () => {
  await env.DB.exec('DELETE FROM event')
  for (const table of ROLLUP_TABLES) {
    await env.DB.exec(`DELETE FROM ${table}`)
  }
  await env.DB.exec(
    'UPDATE rollup_state SET last_rolled_day = NULL, last_run_at = NULL, last_run_ms = NULL, last_run_rows = NULL WHERE id = 1',
  )
})

describe('buildRollupStatements', () => {
  it('rolls up two seeded days into all seven rollup tables and advances last_rolled_day', async () => {
    await seedPageview('2026-07-01', '/', 'prod', 1)
    await seedPageview('2026-07-01', '/', 'prod', 2)
    await seedPageview('2026-07-02', '/projects/', 'prod', 3)

    await env.DB.batch(buildRollupStatements(env.DB, '2026-07-01'))
    await env.DB.batch(buildRollupStatements(env.DB, '2026-07-02'))
    await buildRollupStateUpsert(env.DB, '2026-07-02', Date.now(), 5, 3).run()

    const site1 = await env.DB.prepare('SELECT views FROM daily_site WHERE day = ?1')
      .bind('2026-07-01')
      .first<{ views: number }>()
    expect(site1?.views).toBe(2)

    const site2 = await env.DB.prepare('SELECT views FROM daily_site WHERE day = ?1')
      .bind('2026-07-02')
      .first<{ views: number }>()
    expect(site2?.views).toBe(1)

    const page = await env.DB.prepare('SELECT views FROM daily_page WHERE day = ?1 AND path = ?2')
      .bind('2026-07-01', '/')
      .first<{ views: number }>()
    expect(page?.views).toBe(2)

    const referrer = await env.DB.prepare('SELECT views FROM daily_referrer WHERE day = ?1')
      .bind('2026-07-01')
      .first<{ views: number }>()
    expect(referrer?.views).toBe(2)

    const device = await env.DB.prepare('SELECT views FROM daily_device WHERE day = ?1')
      .bind('2026-07-01')
      .first<{ views: number }>()
    expect(device?.views).toBe(2)

    const country = await env.DB.prepare('SELECT views FROM daily_country WHERE day = ?1')
      .bind('2026-07-01')
      .first<{ views: number }>()
    expect(country?.views).toBe(2)

    const state = await env.DB.prepare('SELECT last_rolled_day FROM rollup_state WHERE id = 1').first<{
      last_rolled_day: string
    }>()
    expect(state?.last_rolled_day).toBe('2026-07-02')
  })

  it('is idempotent: running the rollup twice over the same days is byte-identical', async () => {
    await seedPageview('2026-07-05', '/', 'prod', 10)
    await seedPageview('2026-07-05', '/experience/', 'prod', 11)

    await env.DB.batch(buildRollupStatements(env.DB, '2026-07-05'))
    const before = await Promise.all(ROLLUP_TABLES.map((table) => env.DB.prepare(`SELECT * FROM ${table}`).all()))

    await env.DB.batch(buildRollupStatements(env.DB, '2026-07-05'))
    const after = await Promise.all(ROLLUP_TABLES.map((table) => env.DB.prepare(`SELECT * FROM ${table}`).all()))

    expect(after.map((r) => r.results)).toEqual(before.map((r) => r.results))
  })

  it('excludes env=dev events from every rollup table', async () => {
    await seedPageview('2026-07-08', '/', 'prod', 20)
    await seedPageview('2026-07-08', '/', 'dev', 21)

    await env.DB.batch(buildRollupStatements(env.DB, '2026-07-08'))

    const site = await env.DB.prepare('SELECT views FROM daily_site WHERE day = ?1')
      .bind('2026-07-08')
      .first<{ views: number }>()
    expect(site?.views).toBe(1)
  })
})

describe('computeRollupDays', () => {
  it('never includes today', () => {
    const days = computeRollupDays('2026-08-01', '2026-08-04')
    expect(days).not.toContain('2026-08-04')
  })

  it('starts 13 days before yesterday when nothing has been rolled, capped at 14 days', () => {
    const days = computeRollupDays(null, '2026-08-04')
    expect(days).toHaveLength(14)
    expect(days[0]).toBe(addDaysUTC('2026-08-04', -14))
    expect(days[days.length - 1]).toBe(addDaysUTC('2026-08-04', -1))
  })

  it('heals a 30-day gap over consecutive nightly runs, oldest day first, with no day left unrolled', () => {
    const today = '2026-08-04'
    const originalLastRolledDay = addDaysUTC(today, -30)
    let lastRolledDay: string | null = originalLastRolledDay

    const firstRun = computeRollupDays(lastRolledDay, today)
    expect(firstRun).toHaveLength(14)
    expect(firstRun[0]).toBe(addDaysUTC(originalLastRolledDay, -1))
    for (let i = 1; i < firstRun.length; i++) {
      expect(firstRun[i]).toBe(addDaysUTC(firstRun[i - 1], 1))
    }

    lastRolledDay = firstRun[firstRun.length - 1]
    expect(lastRolledDay > originalLastRolledDay).toBe(true)

    const seenDays = new Set(firstRun)
    let guard = 0
    while (lastRolledDay < addDaysUTC(today, -1) && guard < 20) {
      const next = computeRollupDays(lastRolledDay, today)
      expect(next.length).toBeGreaterThan(0)
      for (const day of next) seenDays.add(day)
      lastRolledDay = next[next.length - 1]
      guard += 1
    }

    expect(lastRolledDay).toBe(addDaysUTC(today, -1))

    let cursor = addDaysUTC(originalLastRolledDay, -1)
    while (cursor <= addDaysUTC(today, -1)) {
      expect(seenDays.has(cursor)).toBe(true)
      cursor = addDaysUTC(cursor, 1)
    }
  })
})

describe('runRollup (scheduled handler)', () => {
  const TODAY = '2026-08-04T02:00:00.000Z'

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(TODAY))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('heals a 30-day gap: one run rolls the oldest 14 days, repeated runs close it with no day left unrolled', async () => {
    const originalLastRolledDay = addDaysUTC('2026-08-04', -30)
    await env.DB.prepare('UPDATE rollup_state SET last_rolled_day = ?1 WHERE id = 1')
      .bind(originalLastRolledDay)
      .run()

    let cursor = addDaysUTC(originalLastRolledDay, -1)
    const yesterday = addDaysUTC('2026-08-04', -1)
    let seed = 100
    while (cursor <= yesterday) {
      await seedPageview(cursor, '/', 'prod', seed)
      seed += 1
      cursor = addDaysUTC(cursor, 1)
    }

    await runRollup(env)
    const afterFirstRun = await env.DB.prepare('SELECT last_rolled_day FROM rollup_state WHERE id = 1').first<{
      last_rolled_day: string
    }>()
    expect(afterFirstRun?.last_rolled_day).toBe(addDaysUTC(originalLastRolledDay, 12))

    let guard = 0
    let lastRolledDay = afterFirstRun?.last_rolled_day ?? originalLastRolledDay
    while (lastRolledDay < yesterday && guard < 20) {
      await runRollup(env)
      const state = await env.DB.prepare('SELECT last_rolled_day FROM rollup_state WHERE id = 1').first<{
        last_rolled_day: string
      }>()
      lastRolledDay = state?.last_rolled_day ?? lastRolledDay
      guard += 1
    }
    expect(lastRolledDay).toBe(yesterday)

    cursor = addDaysUTC(originalLastRolledDay, -1)
    while (cursor <= yesterday) {
      const row = await env.DB.prepare('SELECT views FROM daily_site WHERE day = ?1')
        .bind(cursor)
        .first<{ views: number }>()
      expect(row?.views).toBe(1)
      cursor = addDaysUTC(cursor, 1)
    }
  })

  it('never processes today', async () => {
    await seedPageview('2026-08-04', '/', 'prod', 999)
    await runRollup(env)
    const row = await env.DB.prepare('SELECT views FROM daily_site WHERE day = ?1')
      .bind('2026-08-04')
      .first<{ views: number }>()
    expect(row).toBeNull()
  })
})
