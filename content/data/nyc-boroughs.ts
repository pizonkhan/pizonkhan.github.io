/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-nyc-price-surface.mjs against the public capstone repository:
 * https://github.com/pizonkhan/Springboard-Data-Science, "Capstone 2 - NYC Housing
 * Prediction/Data/final_nyc.csv" (59,350 rows, borough-labelled).
 */

export interface BoroughStat {
  name: string
  n: number
  median: number
  mean: number
  p25: number
  p75: number
  medianPerSqft: number
  /** p10..p90, nine values. */
  deciles: number[]
}

export const BOROUGHS: readonly BoroughStat[] = [
  {
    name: "Manhattan",
    n: 3575,
    median: 1870000,
    mean: 4253143,
    p25: 782000,
    p75: 4400000,
    medianPerSqft: 968,
    deciles: [461000,674500,900000,1325000,1870000,2495000,3450000,5750000,9995000],
  },
  {
    name: "Brooklyn",
    n: 12794,
    median: 969500,
    mean: 1341580,
    p25: 680500,
    p75: 1500000,
    medianPerSqft: 429,
    deciles: [500000,635000,735000,840000,969500,1150000,1360000,1680000,2350000],
  },
  {
    name: "Queens",
    n: 22049,
    median: 725000,
    mean: 843129,
    p25: 505000,
    p75: 960000,
    medianPerSqft: 248,
    deciles: [310000,450000,555000,640000,725000,814843,900000,999999,1325000],
  },
  {
    name: "Bronx",
    n: 8778,
    median: 599000,
    mean: 698800,
    p25: 465000,
    p75: 740000,
    medianPerSqft: 236,
    deciles: [340000,435000,490000,545000,599000,650000,700000,775000,899000],
  },
  {
    name: "Staten Island",
    n: 12154,
    median: 572500,
    mean: 641616,
    p25: 450000,
    p75: 725000,
    medianPerSqft: 177,
    deciles: [349000,422458,478000,529000,572500,625000,680000,775000,925000],
  },
]
