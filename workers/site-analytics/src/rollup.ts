/**
 * The nightly aggregation. No row ever crosses into JavaScript: every statement here is a
 * DELETE followed by an INSERT ... SELECT, so a re-run of the same day is idempotent, and
 * the scheduled handler stays inside the 10 ms CPU ceiling the Free plan gives it.
 */

const BUCKET_CASE = `CASE WHEN duration_s < 5 THEN 0 WHEN duration_s < 15 THEN 1
              WHEN duration_s < 30 THEN 2 WHEN duration_s < 60 THEN 3
              WHEN duration_s < 120 THEN 4 WHEN duration_s < 300 THEN 5
              ELSE 6 END`

/** Ordered DELETE/INSERT pairs for one day. Every parameter is that one day, bound as ?1. */
export function buildRollupStatements(db: D1Database, day: string): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = []

  statements.push(db.prepare('DELETE FROM daily_site WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_site (day, views, visits, clicks, duration_n, duration_sum_s)
         SELECT ?1,
                SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END),
                COUNT(DISTINCT CASE WHEN kind = 'pageview' THEN visit_id END),
                SUM(CASE WHEN kind = 'click' THEN 1 ELSE 0 END),
                SUM(CASE WHEN kind = 'duration' THEN 1 ELSE 0 END),
                COALESCE(SUM(CASE WHEN kind = 'duration' THEN duration_s ELSE 0 END), 0)
         FROM event WHERE env = 'prod' AND day = ?1
         HAVING COUNT(*) > 0`,
      )
      .bind(day),
  )

  statements.push(db.prepare('DELETE FROM daily_page WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_page (day, path, views, visits, duration_n, duration_sum_s)
         SELECT ?1, path,
                SUM(CASE WHEN kind = 'pageview' THEN 1 ELSE 0 END),
                COUNT(DISTINCT CASE WHEN kind = 'pageview' THEN visit_id END),
                SUM(CASE WHEN kind = 'duration' THEN 1 ELSE 0 END),
                COALESCE(SUM(CASE WHEN kind = 'duration' THEN duration_s ELSE 0 END), 0)
         FROM event WHERE env = 'prod' AND day = ?1 AND kind IN ('pageview', 'duration')
         GROUP BY path`,
      )
      .bind(day),
  )

  statements.push(db.prepare('DELETE FROM daily_referrer WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_referrer (day, referrer_host, views)
         SELECT ?1, COALESCE(referrer_host, 'direct'), COUNT(*)
         FROM event WHERE env = 'prod' AND day = ?1 AND kind = 'pageview'
         GROUP BY COALESCE(referrer_host, 'direct')`,
      )
      .bind(day),
  )

  statements.push(db.prepare('DELETE FROM daily_device WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_device (day, device, browser, views)
         SELECT ?1, COALESCE(device, 'unknown'), COALESCE(browser, 'other'), COUNT(*)
         FROM event WHERE env = 'prod' AND day = ?1 AND kind = 'pageview'
         GROUP BY COALESCE(device, 'unknown'), COALESCE(browser, 'other')`,
      )
      .bind(day),
  )

  statements.push(db.prepare('DELETE FROM daily_country WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_country (day, country, views)
         SELECT ?1, COALESCE(country, 'XX'), COUNT(*)
         FROM event WHERE env = 'prod' AND day = ?1 AND kind = 'pageview'
         GROUP BY COALESCE(country, 'XX')`,
      )
      .bind(day),
  )

  statements.push(db.prepare('DELETE FROM daily_click WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_click (day, path, section, target_kind, href, label, clicks)
         SELECT ?1, path, COALESCE(section, 'unknown'), target_kind, href,
                COALESCE(MIN(label), ''), COUNT(*)
         FROM event WHERE env = 'prod' AND day = ?1 AND kind = 'click'
         GROUP BY path, COALESCE(section, 'unknown'), target_kind, href`,
      )
      .bind(day),
  )

  statements.push(db.prepare('DELETE FROM daily_duration_bucket WHERE day = ?1').bind(day))
  statements.push(
    db
      .prepare(
        `INSERT INTO daily_duration_bucket (day, bucket, n)
         SELECT ?1, bucket, COUNT(*) FROM (
           SELECT ${BUCKET_CASE} AS bucket
           FROM event WHERE env = 'prod' AND day = ?1 AND kind = 'duration'
         ) GROUP BY bucket`,
      )
      .bind(day),
  )

  return statements
}

/** Upserts rollup_state after a run. lastDay is the highest day processed, not "today". */
export function buildRollupStateUpsert(
  db: D1Database,
  lastDay: string,
  runAt: number,
  runMs: number,
  runRows: number,
): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO rollup_state (id, last_rolled_day, last_run_at, last_run_ms, last_run_rows)
       VALUES (1, ?1, ?2, ?3, ?4)
       ON CONFLICT(id) DO UPDATE SET
         last_rolled_day = MAX(COALESCE(rollup_state.last_rolled_day, ''), excluded.last_rolled_day),
         last_run_at     = excluded.last_run_at,
         last_run_ms     = excluded.last_run_ms,
         last_run_rows   = excluded.last_run_rows`,
    )
    .bind(lastDay, runAt, runMs, runRows)
}

/** One UTC calendar day, YYYY-MM-DD, offset by delta days (may be negative). */
export function addDaysUTC(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function utcDay(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

/**
 * The days one scheduled run should process, oldest first, capped at 14. Never today.
 *
 * When last_rolled_day is null, starts 13 days before yesterday, so a fresh database catches
 * up over one run. Otherwise starts one day before min(last_rolled_day, yesterday): the
 * "one day before" re-rolls the previous close, which is what heals a duration reading that
 * arrived after its day had already been rolled. A gap of any size closes over consecutive
 * nightly runs, 14 days at a time, because the start point never jumps past an unrolled day.
 */
export function computeRollupDays(lastRolledDay: string | null, todayDay: string): string[] {
  const yesterday = addDaysUTC(todayDay, -1)
  const base = lastRolledDay === null ? yesterday : lastRolledDay < yesterday ? lastRolledDay : yesterday
  const start = lastRolledDay === null ? addDaysUTC(base, -13) : addDaysUTC(base, -1)

  const days: string[] = []
  let cursor = start
  while (cursor <= yesterday && days.length < 14) {
    days.push(cursor)
    cursor = addDaysUTC(cursor, 1)
  }
  return days
}
