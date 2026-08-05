/**
 * Every figure the /projects/iceberg-lakehouse-platform/ visuals render.
 *
 * SOURCING RULE. Every value below was captured from a real run of
 * github.com/pizonkhan/iceberg-lakehouse-platform against its own local stack, and carries the
 * file it came from. Nothing here may be invented, rounded, or inferred. If a number is not in
 * that repository's committed docs or evidence directory, it does not belong on this page.
 *
 * The source data behind every one of these counts is synthetic, generated from a single seed.
 * No real subscriber, payment or viewing history exists anywhere in it.
 */

export interface MedallionStage {
  id: 'generation' | 'bronze' | 'silver' | 'gold'
  /** Card heading. Lowercase, the layer's real name. */
  label: string
  /** One line: what happens in this layer. */
  sub: string
  /** The real figure attached to this stage, pre-formatted. */
  figure: string
  /** The file this figure came from. Required. */
  source: string
}

export interface SubstrateChip {
  name: string
  role: string
}

export interface ScdVersion {
  version: number
  /** What opened this version. */
  changed: string
  /** Type 2 tracked. */
  planTier: string
  /** Type 1 mirror. */
  currentPlanTier: string
  /** Type 3, one step of prior value. */
  previousPlanTier: string
}

export interface WapRun {
  id: 'clean' | 'bad'
  label: string
  exitCode: number
  /** First eight characters of the real Nessie commit hash. */
  mainHash: string
  mainRows: number
  outcome: string
}

export interface ChecksumProof {
  table: string
  rows: string
  checksum: string
  note: string
  /** The file this pair came from. Required, same rule as every other value in this module. */
  source: string
}

export const MEDALLION_STAGES: readonly MedallionStage[] = [
  {
    id: 'generation',
    label: 'generation',
    sub: '9 seeded streams, one seed',
    figure: '120,000,300 playback rows',
    source: 'docs/02-data.md, row counts at full scale.',
  },
  {
    id: 'bronze',
    label: 'bronze',
    sub: 'dlt into Iceberg, append only',
    figure: '9 tables, 5.1 GiB',
    source: 'ARCHITECTURE.md, bronze ingestion. 3 minutes 50 seconds end to end.',
  },
  {
    id: 'silver',
    label: 'silver',
    sub: 'dbt: dedup, type, quality gate',
    figure: '360,201 rows quarantined',
    source: 'docs/05-implementation.md, the playback quality gate.',
  },
  {
    id: 'gold',
    label: 'gold',
    sub: 'dbt: 6 dimensions, 5 facts, 1 bridge',
    figure: '119,640,099 rows in the largest fact',
    source: 'docs/07-operations.md, the row-count baseline.',
  },
]

export const SUBSTRATE: readonly SubstrateChip[] = [
  { name: 'Nessie 0.108.4', role: 'REST catalog, git-style branches' },
  { name: 'MinIO', role: 'S3-compatible object store' },
  { name: 'Trino 483', role: 'query engine, 1.5 GB per node' },
]

export const ORCHESTRATION: SubstrateChip = {
  name: 'Dagster 1.13.16',
  role: '46 assets read from the dbt manifest',
}

export const SCD_SUBSCRIBER_ID = 'sub_046072'

export const SCD_VERSIONS: readonly ScdVersion[] = [
  { version: 1, changed: 'first version', planTier: 'standard', currentPlanTier: 'premium', previousPlanTier: 'none' },
  { version: 2, changed: 'plan change',   planTier: 'premium',  currentPlanTier: 'premium', previousPlanTier: 'standard' },
  { version: 3, changed: 'status change', planTier: 'premium',  currentPlanTier: 'premium', previousPlanTier: 'standard' },
  { version: 4, changed: 'status change', planTier: 'premium',  currentPlanTier: 'premium', previousPlanTier: 'standard' },
  { version: 5, changed: 'status change', planTier: 'premium',  currentPlanTier: 'premium', previousPlanTier: 'standard' },
]

export const WAP_RUNS: readonly WapRun[] = [
  {
    id: 'clean',
    label: 'clean run',
    exitCode: 0,
    mainHash: '9522c1eb',
    mainRows: 8,
    outcome: 'dbt run and dbt test both passed, branch merged to main and deleted',
  },
  {
    id: 'bad',
    label: 'bad run, one null key',
    exitCode: 5,
    mainHash: '9522c1eb',
    mainRows: 8,
    outcome: 'dbt run built 9 rows, dbt test failed, merge never attempted, branch left live',
  },
]

export const JOIN_RESOLUTION = {
  literalLabel: 'literal predicate',
  literalValue: '75 of 62,976 registrations resolved',
  widenedLabel: 'lower bound widened by one second',
  widenedValue: '62,976 of 62,976',
  source: 'docs/04-model.md, the timestamp precision mismatch, measured against the built tables.',
} as const

export const BILLING_BASELINE = {
  rows: '1,500,100',
  checksum: 'BA98E50C4EF99C85',
} as const

export const CHECKSUM_PROOFS: readonly ChecksumProof[] = [
  {
    table: 'dim_subscriber',
    rows: '125,616',
    checksum: '7E4764A639A45DF380D639CC2EE6D409',
    note: 'three consecutive full-refresh builds, identical both times over',
    source: 'README.md',
  },
  {
    table: 'fct_watchlist_adds',
    rows: '750,000',
    checksum: 'C3B540624D04AE72',
    note: 'held across a rebuild, three no-op merges and a full 750,000-row rewrite',
    source: 'docs/03-theory/07-merge-semantics-idempotency.md',
  },
  {
    table: 'fct_daily_subscription_snapshot',
    rows: '27,011,346',
    checksum: '725378a3d48c791d',
    note: 'three incremental runs, exactly 149,384 rows touched each time',
    source: 'docs/03-theory/07-merge-semantics-idempotency.md',
  },
  {
    table: 'fct_billing_transactions',
    rows: '1,500,100',
    checksum: 'BA98E50C4EF99C85',
    note: 'unchanged after a live MERGE was killed mid-write',
    source: 'docs/07-operations.md',
  },
]
