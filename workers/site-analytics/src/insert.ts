import type { NormalizedEvent } from './validate'
import type { RequestContext } from './types'

const INSERT_PAGEVIEW = `
INSERT OR IGNORE INTO event
  (event_id, ts, day, env, kind, visit_id, path, referrer_host, device, browser, country)
VALUES (?1, ?2, ?3, ?4, 'pageview', ?5, ?6, ?7, ?8, ?9, ?10)
`

const INSERT_CLICK = `
INSERT OR IGNORE INTO event
  (event_id, ts, day, env, kind, visit_id, path, section, target_kind, href, label)
VALUES (?1, ?2, ?3, ?4, 'click', ?5, ?6, ?7, ?8, ?9, ?10)
`

// The stored value only ever increases, which is what lets the client resend a cumulative
// total on every visibilitychange, route change and pagehide without double counting.
const UPSERT_DURATION = `
INSERT INTO event (event_id, ts, day, env, kind, visit_id, path, duration_s)
VALUES (?1, ?2, ?3, ?4, 'duration', ?5, ?6, ?7)
ON CONFLICT(event_id) DO UPDATE SET
  duration_s = MAX(event.duration_s, excluded.duration_s),
  ts = excluded.ts
`

/** Builds the ordered insert and upsert statements for one validated /collect body. */
export function buildInsertStatements(
  db: D1Database,
  events: readonly NormalizedEvent[],
  ctx: RequestContext,
): D1PreparedStatement[] {
  return events.map((event) => {
    if (event.kind === 'pageview') {
      return db
        .prepare(INSERT_PAGEVIEW)
        .bind(
          event.id,
          ctx.ts,
          ctx.day,
          ctx.env,
          event.visit,
          event.path,
          event.referrerHost,
          ctx.device,
          ctx.browser,
          ctx.country,
        )
    }
    if (event.kind === 'click') {
      return db
        .prepare(INSERT_CLICK)
        .bind(
          event.id,
          ctx.ts,
          ctx.day,
          ctx.env,
          event.visit,
          event.path,
          event.section,
          event.targetKind,
          event.href,
          event.label,
        )
    }
    return db
      .prepare(UPSERT_DURATION)
      .bind(event.id, ctx.ts, ctx.day, ctx.env, event.visit, event.path, event.durationSeconds)
  })
}
