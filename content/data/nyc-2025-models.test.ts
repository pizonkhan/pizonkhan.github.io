import { describe, expect, it } from 'vitest'
import { IMPORTANCE_2025, MODELS_2025, TRAINING, WINNER } from './nyc-2025-models'

/**
 * Shape, ordering and sanity-band assertions over the real ladder
 * scripts/train-nyc-sales-2025.py produced. Does not pin any measured value: a rerun against a
 * revised snapshot will change the numbers, and these checks still hold.
 */

describe('content/data/nyc-2025-models.ts', () => {
  it('is ordered worst to best by test MAE, baseline first with the highest MAE', () => {
    expect(MODELS_2025.length).toBeGreaterThanOrEqual(6)
    for (let i = 1; i < MODELS_2025.length; i += 1) {
      expect(MODELS_2025[i].mae).toBeLessThanOrEqual(MODELS_2025[i - 1].mae)
    }
    expect(MODELS_2025[0].family).toBe('baseline')
    expect(MODELS_2025[0].mae).toBe(Math.max(...MODELS_2025.map((m) => m.mae)))
  })

  it('WINNER is the last entry in MODELS_2025', () => {
    expect(WINNER).toBe(MODELS_2025[MODELS_2025.length - 1])
  })

  it.each(MODELS_2025)('$name: r2 lies between -1 and 1, mae lies between $50,000 and $1,000,000', (model) => {
    expect(model.r2).toBeGreaterThanOrEqual(-1)
    expect(model.r2).toBeLessThanOrEqual(1)
    expect(model.mae).toBeGreaterThanOrEqual(50_000)
    expect(model.mae).toBeLessThanOrEqual(1_000_000)
  })

  it('IMPORTANCE_2025 has 12 entries, sorted descending by meanIncreaseMae', () => {
    expect(IMPORTANCE_2025.length).toBe(12)
    for (let i = 1; i < IMPORTANCE_2025.length; i += 1) {
      expect(IMPORTANCE_2025[i].meanIncreaseMae).toBeLessThanOrEqual(IMPORTANCE_2025[i - 1].meanIncreaseMae)
    }
  })

  it('TRAINING.seed is 42', () => {
    expect(TRAINING.seed).toBe(42)
  })

  it('TRAINING.rows equals trainRows plus testRows', () => {
    expect(TRAINING.trainRows + TRAINING.testRows).toBe(TRAINING.rows)
  })

  it('every model name is non-empty and unique', () => {
    const names = MODELS_2025.map((m) => m.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) {
      expect(name.trim().length).toBeGreaterThan(0)
    }
  })

  it('every importance feature is a real training feature and appears once', () => {
    const featureSet = new Set(TRAINING.features)
    const importanceFeatures = IMPORTANCE_2025.map((entry) => entry.feature)
    expect(new Set(importanceFeatures).size).toBe(importanceFeatures.length)
    for (const feature of importanceFeatures) {
      expect(featureSet.has(feature)).toBe(true)
    }
  })
})
