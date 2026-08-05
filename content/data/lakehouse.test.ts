import { describe, expect, it } from 'vitest'
import {
  MEDALLION_STAGES,
  SCD_VERSIONS,
  WAP_RUNS,
  CHECKSUM_PROOFS,
  JOIN_RESOLUTION,
  BILLING_BASELINE,
  SUBSTRATE,
  ORCHESTRATION,
  SCD_SUBSCRIBER_ID,
  type MedallionStage,
  type WapRun,
  type ChecksumProof,
} from './lakehouse'

const MODULE_VALUES: unknown[] = [
  MEDALLION_STAGES,
  SCD_VERSIONS,
  WAP_RUNS,
  CHECKSUM_PROOFS,
  JOIN_RESOLUTION,
  BILLING_BASELINE,
  SUBSTRATE,
  ORCHESTRATION,
  SCD_SUBSCRIBER_ID,
]

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, out)
  } else if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectStrings(entry, out)
  }
  return out
}

describe('content/data/lakehouse', () => {
  it('no string anywhere in the module contains an em dash', () => {
    const strings = collectStrings(MODULE_VALUES)
    for (const value of strings) {
      expect(value).not.toContain('—')
    }
  })

  it('every MedallionStage.source is non-empty', () => {
    for (const stage of MEDALLION_STAGES) {
      expect(stage.source.trim().length).toBeGreaterThan(0)
    }
  })

  it('MEDALLION_STAGES has exactly four entries in generation, bronze, silver, gold order', () => {
    const ids = MEDALLION_STAGES.map((stage: MedallionStage) => stage.id)
    expect(ids).toEqual(['generation', 'bronze', 'silver', 'gold'])
  })

  it('SCD_VERSIONS has exactly five entries with the right SCD-typed columns', () => {
    expect(SCD_VERSIONS).toHaveLength(5)
    for (const version of SCD_VERSIONS) {
      expect(version.currentPlanTier).toBe('premium')
      if (version.version === 1) {
        expect(version.previousPlanTier).toBe('none')
      } else {
        expect(version.previousPlanTier).toBe('standard')
      }
    }
  })

  it('WAP_RUNS has exactly two entries, both at 8 rows on main with the same hash', () => {
    expect(WAP_RUNS).toHaveLength(2)
    const hashes = new Set(WAP_RUNS.map((run: WapRun) => run.mainHash))
    expect(hashes.size).toBe(1)
    for (const run of WAP_RUNS) {
      expect(run.mainRows).toBe(8)
    }
    const clean = WAP_RUNS.find((run: WapRun) => run.id === 'clean')
    const bad = WAP_RUNS.find((run: WapRun) => run.id === 'bad')
    expect(clean?.exitCode).toBe(0)
    expect(bad?.exitCode).toBe(5)
  })

  it('CHECKSUM_PROOFS checksums match the captured literals exactly, character for character', () => {
    const byTable = new Map(CHECKSUM_PROOFS.map((proof: ChecksumProof) => [proof.table, proof.checksum]))
    expect(byTable.get('dim_subscriber')).toBe('7E4764A639A45DF380D639CC2EE6D409')
    expect(byTable.get('fct_watchlist_adds')).toBe('C3B540624D04AE72')
    expect(byTable.get('fct_daily_subscription_snapshot')).toBe('725378a3d48c791d')
    expect(byTable.get('fct_billing_transactions')).toBe('BA98E50C4EF99C85')
  })

  it('every CHECKSUM_PROOFS entry has a non-empty source', () => {
    for (const proof of CHECKSUM_PROOFS) {
      expect(proof.source.trim().length).toBeGreaterThan(0)
    }
  })
})
