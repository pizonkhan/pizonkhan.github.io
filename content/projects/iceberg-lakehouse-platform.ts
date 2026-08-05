import type { ProjectRecord } from './types'

export const icebergLakehousePlatform: ProjectRecord = {
  slug: 'iceberg-lakehouse-platform',
  status: 'live',
  title: 'A lakehouse that blocks bad data before it lands',
  tagline:
    'A local Iceberg lakehouse on Nessie, Trino and dbt: 120 million synthetic playback rows '
    + 'with eleven data defects built in on purpose, a write-audit-publish gate that kept a '
    + 'bad load off main, and a checksum behind every claim.',
  summary:
    'This is a full lakehouse running on one machine. Nessie is the Iceberg catalog, MinIO is '
    + 'the object store, Trino is the query engine, dlt loads bronze and dbt builds silver and '
    + 'gold. The source data is generated rather than downloaded, from a single seed, with '
    + 'eleven data quality problems injected at known rates, because a pipeline that has only '
    + 'ever seen clean data has not been tested. The dimensional model is real: six conformed '
    + 'dimensions including a Type 6 hybrid, five facts, one bridge and three role-playing '
    + 'date views. Every claim on this page has a row count, a checksum or a captured command '
    + 'output behind it in the repository.',
  year: '2026',
  demonstration:
    'The diagram at the top follows a row from the generator through bronze, silver and gold '
    + 'with the real count at each stage. Under it, three figures replay real runs: the join '
    + 'boundary that dropped 99.88% of a join and the one-second fix, the branch that failed '
    + 'its tests and never reached main, and a live write killed mid-flight that left the '
    + 'table exactly as it was.',
  glyph: 'flow',
  stack: ['Apache Iceberg', 'Trino', 'dbt', 'Dagster', 'Nessie', 'dlt', 'MinIO', 'Python', 'DuckDB'],
  dataset: {
    name: 'Synthetic subscription streaming data, generated from one seed',
    scale: '9 source streams, 120,000,300 playback rows, 11 injected data defects',
    provenance:
      'The project’s own generation package produces every row from a single seed, so the '
      + 'whole dataset regenerates identical on demand. No real subscriber, no real payment '
      + 'and no real viewing history is behind any row. Every figure on this page is a count, '
      + 'a checksum or command output captured from a real run against the local stack.',
    href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform/blob/main/docs/02-data.md',
  },
  headlineFigures: [
    {
      label: 'Rows in the largest fact table',
      value: '119,640,099',
      source: 'fct_playback_events, verified row count. docs/07-operations.md, the monitoring baseline.',
    },
    {
      label: 'dbt data tests passing',
      value: '288 / 288',
      source: 'make test, 288 of 288 dbt data tests. README.md quickstart.',
    },
    {
      label: 'Bad rows that reached main',
      value: '0',
      source:
        'The write-audit-publish gate blocked a load carrying a null key. main stayed at '
        + 'exactly 8 rows with an unchanged hash. docs/evidence/write-audit-publish/.',
    },
  ],
  sections: [
    {
      id: 'defects-on-purpose',
      heading: 'Data with the defects built in',
      body: [
        'A pipeline that has only ever run against clean data has not been tested, it has '
          + 'been demonstrated. So the source data here is generated rather than downloaded, '
          + 'from one seed, with eleven data quality problems injected at known rates and '
          + 'every affected row written into a manifest. Duplicate business keys on 1% of '
          + 'billing and signup rows. 3% of playback rows peeled out of their own '
          + 'chronological batch and spliced 3 to 15 batches later. 2% with a null device id. '
          + '0.3% malformed, split almost evenly between a negative duration, an end time '
          + 'before the start time, and a start time pushed into the future. Two hundred '
          + 'subscribers whose profile rows land after the events that reference them.',
        'Every one of those is checked against ground truth rather than inferred after the '
          + 'fact, because the generator wrote down exactly which rows it broke. The whole '
          + 'dataset regenerates identical from the seed, verified by diffing the SHA-256 of '
          + 'every output file across two small-scale runs. That is what makes a later claim '
          + 'about the pipeline something anyone can rerun instead of something they take on '
          + 'faith.',
      ],
    },
    {
      id: 'point-in-time',
      heading: 'Joining a fact to the version that was true at the time',
      hasVisual: true,
      body: [
        'A fact resolves its subscriber on the fact’s own event timestamp, never on load '
          + 'time, against the dimension’s half-open interval from effective_from up to but '
          + 'not including effective_to. That is the whole point of keeping history: a '
          + 'playback session in March should land on the plan tier the subscriber held in '
          + 'March, not the one they hold now. The intervals are provably contiguous and '
          + 'non-overlapping, tested with mutually_exclusive_ranges with gaps not allowed and '
          + 'zero-length ranges not allowed, so the join can match at most one row.',
        'Then the real data broke it. Two of the four generators write timestamps at '
          + 'whole-second precision for throughput at 120 million rows, and two keep true '
          + 'microseconds. Dimension boundaries carry microseconds while every fact event '
          + 'lands on an exact second, and where the two are meant to be simultaneous the '
          + 'fact falls just short. On fct_signup_funnel, where registration is the very '
          + 'event that creates the subscriber’s first version, the literal predicate '
          + 'resolved 75 of 62,976 rows. Widening only the lower bound by one second, the '
          + 'maximum possible truncation error given whole-second sources, took it to 62,976 '
          + 'of 62,976. The figure below is that exact boundary.',
      ],
    },
    {
      id: 'scd',
      heading: 'One subscriber row that answers three questions',
      hasVisual: true,
      body: [
        'dim_subscriber is a Type 6 hybrid over roughly 50,000 subscribers and 125,616 rows '
          + 'with history. plan_tier and status are Type 2 tracked, so a change to either '
          + 'opens a new version. current_plan_tier is Type 1, overwritten on every '
          + 'historical row of that subscriber, so the latest truth is readable from any row '
          + 'in the chain. previous_plan_tier is Type 3, one step of prior value. One '
          + 'dimension answers both what was true of this subscriber at the moment of this '
          + 'event and what is true of them now, which neither a pure Type 2 nor a pure Type '
          + '1 table can do alone.',
        'previous_plan_tier is the part that is easy to get wrong. It is not a lag over '
          + 'versions, because a run of status-only versions between two real plan changes '
          + 'must all carry the same prior tier. The model computes a plan-segment counter '
          + 'that increments only when plan_tier itself changes, lags across those segments, '
          + 'then broadcasts the value back to every version sharing a segment. The figure '
          + 'below is subscriber sub_046072 out of the built table: five versions, a real '
          + 'plan change at version 2, three status-only versions after it, and '
          + 'previous_plan_tier holding standard across all four.',
      ],
    },
    {
      id: 'wap',
      heading: 'The gate that kept a bad load off main',
      hasVisual: true,
      body: [
        'Write-audit-publish is one script. It cuts a Nessie branch off main, registers a '
          + 'Trino catalog whose Iceberg REST URL points at that branch, runs dbt run and '
          + 'then dbt test against it, and merges back to main only if both pass. Nessie is '
          + 'the catalog specifically because its branches are catalog-wide rather than per '
          + 'table, so a change spanning several tables merges or is discarded as one unit. '
          + 'On failure main is never touched and the branch is left live for inspection, '
          + 'which means the bad data stays fully queryable on its own branch and reachable '
          + 'from nowhere else.',
        'The figure below is two captured runs, not an illustration. The clean run merged '
          + 'and left main with eight rows. The bad run built nine rows including one with a '
          + 'null key, passed dbt run, failed dbt test on that column, exited 5 at the audit '
          + 'stage and never attempted the merge. main’s hash was byte-identical before and '
          + 'after and still held exactly eight rows. The failed branch, queried afterward '
          + 'through a one-off catalog pointed straight at it, held all nine.',
      ],
    },
    {
      id: 'atomicity',
      heading: 'Killing a write on purpose to see what survives',
      hasVisual: true,
      body: [
        'Idempotency is easy to claim and cheap to check, so it is checked with numbers. '
          + 'Three consecutive full-refresh builds of dim_subscriber produced the same '
          + '125,616 rows and the same checksum. fct_watchlist_adds held its checksum across '
          + 'a rebuild, three no-op merges and a backfill that force-rewrote all 750,000 '
          + 'rows. fct_daily_subscription_snapshot held 27,011,346 rows and its checksum '
          + 'across three incremental runs while touching exactly 149,384 rows each time, '
          + 'which is what proves the bounded design is actually bounded. On the 120 million '
          + 'row fact a full checksum does not fit in 1.5 GB, so it is a 30-day sample of '
          + '3,288,953 rows, recorded as the partial fingerprint it is rather than presented '
          + 'as the same thing.',
        'The stronger test was destructive. A live Trino MERGE against '
          + 'fct_billing_transactions was launched with a backfill window that forced a '
          + 'rewrite of all 1,500,100 rows, then the object store was polled directly until '
          + 'a real Parquet file appeared, then the query was killed server side and the '
          + 'client process was killed with SIGKILL. Both matter, because Trino keeps '
          + 'executing after a client disconnects. The file was still sitting in the object '
          + 'store afterward, and the table’s own files metadata referenced it nowhere. Row '
          + 'count and checksum were unchanged, count queries succeeded throughout, and '
          + 'rerunning the same command matched the original baseline with no repair step. '
          + 'That is what an atomic commit means in practice, and it is a different claim '
          + 'once you have actually broken it.',
      ],
    },
    {
      id: 'orchestration',
      heading: '46 assets, none of them drawn by hand',
      body: [
        'Dagster wraps the whole build as an asset graph. Asset keys, dependencies and '
          + 'column schemas come from the dbt manifest rather than a hand-built DAG, and the '
          + 'one asset dbt does not know about, the dlt bronze load, is a multi-asset whose '
          + 'keys are chosen to match what dagster-dbt already computes for each dbt source, '
          + 'so the upstream edges resolve with no manual mapping. The graph loads 46 assets: '
          + '37 dbt models plus 9 bronze source tables, grouped by layer. The generator '
          + 'itself is deliberately left out of the graph, because making it re-runnable '
          + 'upstream of bronze would invite quietly regenerating the dataset every number in '
          + 'the project is built against.',
        'Column-level lineage is derived from the compiled SQL with sqlglot at '
          + 'materialization time, which is what makes it worth reading. On dim_subscriber '
          + 'the captured lineage traces churn_date_key back to '
          + 'silver_subscriber_events.changed_at and .status, which is exactly the '
          + 'window-function churn detection in the model, and previous_plan_tier back to '
          + '.changed_at, .plan_tier and .subscriber_id, which is the plan-segment lag. A '
          + 'one-to-one passthrough model would show one dependency per column. The fan-in '
          + 'is what a real transformation looks like, and nobody typed it in.',
      ],
    },
    {
      id: 'limits',
      heading: 'What this stack will not do',
      body: [
        'It runs on one Trino node capped at 1.5 GB per query, and that cap is a design '
          + 'constraint rather than a footnote. A bare full-width scan of the 120 million row '
          + 'playback table costs about 1.47 to 1.50 GB, right at the edge, so the '
          + 'malformed-row filter is three inlined column comparisons instead of a derived '
          + 'case column, which would have defeated predicate pushdown to the Iceberg '
          + 'connector. There is no dbt uniqueness test on playback_session_id at all: the '
          + 'equivalent query crashed the Trino coordinator outright, so uniqueness was '
          + 'checked by hand in 44 monthly chunks, zero duplicates across 119,640,099 rows, '
          + 'and written down as the real gap it is.',
        'Iceberg-native time travel does not work here either. Nessie’s REST bridge '
          + 'deliberately exposes only the snapshot matching the current commit, confirmed '
          + 'against Nessie’s own documentation and reproduced with a plain Trino insert '
          + 'outside dbt entirely. The working mechanism is a checked reference, a branch '
          + 'name with a commit hash appended, passed inside the catalog URL, and rollback is '
          + 'a real branch reset. Retention is the honest gap: a policy was chosen and '
          + 'written down, and nothing runs it, so storage growth is unbounded today. There '
          + 'is no cloud deployment and there will not be one, because no free tier here '
          + 'comes with a hard zero-dollar guarantee.',
      ],
    },
    {
      id: 'next-time',
      heading: 'What I’d do differently',
      body: [
        'Give every generator the same timestamp precision on day one. The whole-second '
          + 'versus microsecond split between the vectorized generators and the plain Python '
          + 'ones was a real correctness bug that needed a bounded, justified mitigation '
          + 'bolted onto the join rule after the fact. A precision contract up front removes '
          + 'the whole class of boundary bug instead of measuring and patching one instance '
          + 'of it.',
        'Write the enforcement test at the same time as the rule. The medallion boundary, '
          + 'no gold model reads bronze directly, held on review discipline for the entire '
          + 'build. It is now a test that parses the dbt manifest and asserts no model under '
          + 'intermediate or marts depends on a bronze source, verified clean across all 68 '
          + 'models, but it only exists because a review pass asked how I actually knew, and '
          + 'the honest answer was that someone would have caught it at review time. And fix '
          + 'a diagnosed bug at its source. The title catalog ordering defect was root-caused '
          + 'correctly the first time, written up, and shipped anyway, which left 20,646,958 '
          + 'of 119,640,099 fact rows pointing at the unknown title member until a later pass '
          + 'went back and fixed the generator.',
      ],
    },
  ],
  links: [
    {
      label: 'The project repository',
      href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform',
      kind: 'repo',
    },
    {
      label: 'The write-audit-publish gate, ops/wap.py',
      href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform/blob/main/ops/wap.py',
      kind: 'repo',
    },
    {
      label: 'Raw output from the run that was blocked',
      href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform/tree/main/docs/evidence/write-audit-publish',
      kind: 'report',
    },
    {
      label: 'The dimensional model, every table justified',
      href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform/blob/main/docs/04-model.md',
      kind: 'report',
    },
    {
      label: 'What this project deliberately did not do',
      href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform/blob/main/docs/06-tradeoffs.md',
      kind: 'report',
    },
    {
      label: 'The runbook, including both real incidents',
      href: 'https://github.com/pizonkhan/iceberg-lakehouse-platform/blob/main/docs/07-operations.md',
      kind: 'report',
    },
  ],
  dataStatement:
    'Every number on this page comes from a real run of this project against its own local '
    + 'stack: Trino 483, Nessie 0.108.4, MinIO and Postgres in Docker, dbt-trino 1.10.3, '
    + 'Dagster 1.13.16. The source data is synthetic and generated from a single seed, so '
    + 'nothing here describes a real person, a real payment or a real viewing history. Row '
    + 'counts, checksums and command output are quoted as captured, not rounded. The two '
    + 'write-audit-publish runs replay output committed under '
    + 'docs/evidence/write-audit-publish/ in the repository.',
}
