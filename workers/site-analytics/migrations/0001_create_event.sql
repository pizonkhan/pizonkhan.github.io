-- The landing table. Append only from the ingestion path. One row per event.
-- Column count is kept low and nullable columns are left NULL for event kinds that do not
-- carry them, because on D1's free plan every index adds a second row write per insert.
CREATE TABLE event (
  event_id      TEXT    NOT NULL PRIMARY KEY,
  ts            INTEGER NOT NULL,
  day           TEXT    NOT NULL,
  env           TEXT    NOT NULL CHECK (env IN ('prod', 'dev')),
  kind          TEXT    NOT NULL CHECK (kind IN ('pageview', 'click', 'duration')),
  visit_id      TEXT    NOT NULL,
  path          TEXT    NOT NULL,
  referrer_host TEXT,
  device        TEXT,
  browser       TEXT,
  country       TEXT,
  section       TEXT,
  target_kind   TEXT,
  href          TEXT,
  label         TEXT,
  duration_s    INTEGER
);

-- One index, deliberately. Every serving query and every rollup statement filters on
-- env then kind then a day range, in that order, so this covers all of them.
-- Cost: three rows written per insert (table, primary key index, this index).
CREATE INDEX idx_event_env_kind_day ON event (env, kind, day);
