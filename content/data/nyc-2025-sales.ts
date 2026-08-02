/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-nyc-sales-2025.mjs against NYC Open Data's "NYC Citywide
 * Annualized Calendar Sales Update" (dataset id w2pb-icbu), New York City Department of
 * Finance: https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu
 * Calendar 2025, filtered to residential building classes and a $100,000 to
 * $10,000,000 sale price, geocoded. 44784 sales survive.
 */

export interface BoroughStat2025 {
  name: string
  /** Sales surviving the filter chain. */
  n: number
  median: number
  p25: number
  p75: number
  /** Median dollars per gross square foot, over the subset that records one. */
  medianPerSqFt: number
  /** How many rows that median is computed from. Printed on the page: it is small. */
  perSqFtRows: number
}

export const SNAPSHOT = {
  /** Date the CSV was downloaded. Printed on the page. */
  generatedAt: "2026-08-01",
  /** SHA-256 of the input CSV, so a rerun can be proven identical. */
  inputSha256: "b95d5b25c20ec1fb4207e2eb7a16a086584e53b8e76db7ad370bd22f996ea784",
  year: 2025,
  first: "2025-01-02",
  last: "2025-12-31",
  rowsDownloaded: 84693,
  rowsGeocoded: 82974,
  rowsInPriceBracket: 49953,
  points: 44784,
} as const

export const PRICE_FILTER = { min: 100000, max: 10000000 } as const

export const CLASS_CODES = ["01","02","03","04","09","10","12","13","15","17"] as const

export const CLASS_LABELS: Record<string, string> = {
  '01': "One family dwelling",
  '02': "Two family dwelling",
  '03': "Three family dwelling",
  '04': "Tax class 1 condo",
  '09': "Co-op, walkup apartment",
  '10': "Co-op, elevator apartment",
  '12': "Condo, walkup apartment",
  '13': "Condo, elevator apartment",
  '15': "Condo, 2 to 10 unit residential",
  '17': "Condo co-op",
}

export const CLASS_GROUPS = {
  houses: ["01","02","03"],
  condos: ["04","12","13","15"],
  coops: ["09","10","17"],
} as const

export const BOROUGHS_2025: readonly BoroughStat2025[] = [
  {
    name: "Manhattan",
    n: 12661,
    median: 1150000,
    p25: 670000,
    p75: 2200000,
    medianPerSqFt: 1042,
    perSqFtRows: 189,
  },
  {
    name: "Bronx",
    n: 3212,
    median: 627650,
    p25: 325000,
    p75: 860000,
    medianPerSqFt: 378,
    perSqFtRows: 2047,
  },
  {
    name: "Brooklyn",
    n: 10978,
    median: 995000,
    p25: 660000,
    p75: 1650000,
    medianPerSqFt: 588,
    perSqFtRows: 5469,
  },
  {
    name: "Queens",
    n: 13935,
    median: 720000,
    p25: 425000,
    p75: 995000,
    medianPerSqFt: 564,
    perSqFtRows: 7779,
  },
  {
    name: "Staten Island",
    n: 3998,
    median: 710000,
    p25: 550000,
    p75: 883750,
    medianPerSqFt: 469,
    perSqFtRows: 3441,
  },
]

export const CITYWIDE_2025 = { median: 840000, p25: 545000, p75: 1349000 } as const

/** Septiles of the point price distribution: the six ramp breakpoints. */
export const PRICE_BREAKS: readonly number[] = [397495,594054,750000,935000,1240000,1880308]
