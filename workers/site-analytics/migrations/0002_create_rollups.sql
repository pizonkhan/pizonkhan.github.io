-- The serving layer. One row per day per dimension value. Written only by the nightly
-- rollup, read by /stats. Every day strictly before today is served from here rather than
-- from a scan of `event`, which is what keeps the free plan's 5,000,000 rows read per day
-- from being the binding constraint as the landing table grows.
CREATE TABLE daily_site (
  day            TEXT    NOT NULL PRIMARY KEY,
  views          INTEGER NOT NULL DEFAULT 0,
  visits         INTEGER NOT NULL DEFAULT 0,
  clicks         INTEGER NOT NULL DEFAULT 0,
  duration_n     INTEGER NOT NULL DEFAULT 0,
  duration_sum_s INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE daily_page (
  day            TEXT    NOT NULL,
  path           TEXT    NOT NULL,
  views          INTEGER NOT NULL DEFAULT 0,
  visits         INTEGER NOT NULL DEFAULT 0,
  duration_n     INTEGER NOT NULL DEFAULT 0,
  duration_sum_s INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE TABLE daily_referrer (
  day           TEXT    NOT NULL,
  referrer_host TEXT    NOT NULL,
  views         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, referrer_host)
);

CREATE TABLE daily_device (
  day     TEXT    NOT NULL,
  device  TEXT    NOT NULL,
  browser TEXT    NOT NULL,
  views   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, device, browser)
);

CREATE TABLE daily_country (
  day     TEXT    NOT NULL,
  country TEXT    NOT NULL,
  views   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, country)
);

CREATE TABLE daily_click (
  day         TEXT    NOT NULL,
  path        TEXT    NOT NULL,
  section     TEXT    NOT NULL,
  target_kind TEXT    NOT NULL,
  href        TEXT    NOT NULL,
  label       TEXT    NOT NULL DEFAULT '',
  clicks      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path, section, target_kind, href)
);

-- Bucketed time-on-page, so the all-time distribution and its median can be served without
-- scanning every duration row ever recorded. Bucket edges in seconds:
-- 0: <5, 1: 5-15, 2: 15-30, 3: 30-60, 4: 60-120, 5: 120-300, 6: >=300.
CREATE TABLE daily_duration_bucket (
  day    TEXT    NOT NULL,
  bucket INTEGER NOT NULL,
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, bucket)
);

-- Pipeline health, rendered on the page. One row, id 1.
CREATE TABLE rollup_state (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  last_rolled_day TEXT,
  last_run_at     INTEGER,
  last_run_ms     INTEGER,
  last_run_rows   INTEGER
);

INSERT OR IGNORE INTO rollup_state (id) VALUES (1);
