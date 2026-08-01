#!/usr/bin/env node
/**
 * Deterministic aggregation of the NYC capstone's cleaned listing extract into the three
 * committed data modules this site ships: content/data/nyc-price-surface.ts and
 * content/data/nyc-boroughs.ts. (content/data/nyc-model-ladder.ts is transcribed by hand
 * from the notebook's printed cells; this script does not touch it.)
 *
 * Source: https://github.com/pizonkhan/Springboard-Data-Science
 * File:   "Capstone 2 - NYC Housing Prediction/Data/final_nyc.csv"
 *
 * This script is run manually, once, against a local clone of that public repository. The
 * clone is never committed here and this script is never wired into `npm run build`. The CSV
 * carries street addresses; nothing per-listing leaves the clone. Only aggregates of at least
 * four listings per grid cell are written out.
 *
 * Usage:
 *   node scripts/build-nyc-price-surface.mjs "<path-to-clone>/Capstone 2 - NYC Housing Prediction/Data/final_nyc.csv"
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const GRID_STEP = 0.005
const BOROUGH_NAMES = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Usage: node scripts/build-nyc-price-surface.mjs <path-to-final_nyc.csv>')
  process.exit(1)
}

const rows = parseCsv(readFileSync(inputPath, 'utf-8'))
console.log(`Parsed ${rows.length} rows from ${inputPath}`)

// --- Grid-cell aggregation -------------------------------------------------------------

/** @type {Map<string, { r: number, c: number, prices: number[], sqfts: (number|null)[], boroughs: string[] }>} */
const preFilterCells = new Map()
let rowMin = Infinity
let rowMax = -Infinity
let colMin = Infinity
let colMax = -Infinity

for (const row of rows) {
  const lat = Number(row.latitude)
  const lon = Number(row.longitude)
  const price = Number(row.price)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(price)) continue

  const r = Math.round(lat / GRID_STEP)
  const c = Math.round(lon / GRID_STEP)
  // ROW_RANGE / COL_RANGE describe the full raw grid extent of every geocoded listing, not
  // just the cells that survive the minimum-count filter below, so the map's coordinate
  // space matches the dataset's true footprint (84 rows x 112 columns).
  if (r < rowMin) rowMin = r
  if (r > rowMax) rowMax = r
  if (c < colMin) colMin = c
  if (c > colMax) colMax = c

  const key = `${r}:${c}`
  let cell = preFilterCells.get(key)
  if (!cell) {
    cell = { r, c, prices: [], sqfts: [], boroughs: [] }
    preFilterCells.set(key, cell)
  }
  cell.prices.push(price)
  // $_Per_SqFT carries data-entry outliers at both ends (zero and eight-figure-per-square-foot
  // rows); a listing must be a positive, plausible rate to count toward a cell's per-sqft
  // median. This filter (rather than a narrower one) is what reproduces the septile
  // breakpoints below exactly against the planner-verified figures.
  const sqft = Number(row.$_Per_SqFT)
  cell.sqfts.push(Number.isFinite(sqft) && sqft > 0 && sqft <= 10_000 ? sqft : null)
  cell.boroughs.push(row.Borough)
}

const survivingCells = [...preFilterCells.values()].filter((cell) => cell.prices.length >= 4)
const totalCovered = survivingCells.reduce((sum, cell) => sum + cell.prices.length, 0)

console.log(
  `${survivingCells.length} cells survive the >=4-listing floor, covering ${totalCovered} `
  + `of ${rows.length} rows (${((totalCovered / rows.length) * 100).toFixed(1)}%).`,
)

const cellRecords = survivingCells
  .map((cell) => {
    const n = cell.prices.length
    const med = Math.round(median(cell.prices))
    const validSqft = cell.sqfts.filter((s) => s !== null)
    const sqft = validSqft.length >= 4 ? Math.round(median(validSqft)) : null
    const b = BOROUGH_NAMES.indexOf(modalBorough(cell.boroughs))
    return { r: cell.r, c: cell.c, n, med, sqft, b }
  })
  .sort((a, b) => (a.r - b.r) || (a.c - b.c))

const cellMedians = cellRecords.map((cell) => cell.med).sort((a, b) => a - b)
const cellSqfts = cellRecords.map((cell) => cell.sqft).filter((v) => v !== null).sort((a, b) => a - b)

const medianBreaks = quantileBreaks(cellMedians, 7).map(Math.round)
const sqftBreaks = quantileBreaks(cellSqfts, 7).map(Math.round)

console.log('MEDIAN_BREAKS', medianBreaks)
console.log('SQFT_BREAKS', sqftBreaks)
console.log('ROW_RANGE', [rowMin, rowMax])
console.log('COL_RANGE', [colMin, colMax])

writeFileSync(
  resolveRepoPath('content/data/nyc-price-surface.ts'),
  renderPriceSurfaceModule({ cellRecords, medianBreaks, sqftBreaks, rowRange: [rowMin, rowMax], colRange: [colMin, colMax] }),
)

// --- Borough aggregation ----------------------------------------------------------------

/** @type {Map<string, { prices: number[], sqfts: number[] }>} */
const byBorough = new Map(BOROUGH_NAMES.map((name) => [name, { prices: [], sqfts: [] }]))

for (const row of rows) {
  const bucket = byBorough.get(row.Borough)
  if (!bucket) continue
  const price = Number(row.price)
  if (Number.isFinite(price)) bucket.prices.push(price)
  const sqft = Number(row.$_Per_SqFT)
  if (Number.isFinite(sqft) && sqft > 0 && sqft <= 10_000) bucket.sqfts.push(sqft)
}

const boroughStats = BOROUGH_NAMES.map((name) => {
  const { prices, sqfts } = byBorough.get(name)
  const sorted = [...prices].sort((a, b) => a - b)
  return {
    name,
    n: sorted.length,
    median: Math.round(median(sorted)),
    mean: Math.round(prices.reduce((sum, v) => sum + v, 0) / prices.length),
    // p25/p75 in the planner-verified table land on an actually-observed price rather than an
    // interpolated one, so these two use the "lower" quantile convention; deciles below use
    // ordinary linear interpolation. Both are computed off the same sorted array.
    p25: lowerQuantile(sorted, 0.25),
    p75: lowerQuantile(sorted, 0.75),
    medianPerSqft: Math.round(median([...sqfts].sort((a, b) => a - b))),
    deciles: Array.from({ length: 9 }, (_, i) => Math.round(linearQuantile(sorted, (i + 1) / 10))),
  }
})

writeFileSync(resolveRepoPath('content/data/nyc-boroughs.ts'), renderBoroughsModule(boroughStats))

console.log('Wrote content/data/nyc-price-surface.ts and content/data/nyc-boroughs.ts')

// --- helpers -------------------------------------------------------------------------

function resolveRepoPath(relative) {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '..', relative)
}

/** Minimal CSV parser. Handles quoted fields containing commas, which this file's address column does. */
function parseCsv(text) {
  const lines = text.split(/\r\n|\n/).filter((line) => line.length > 0)
  const header = splitCsvLine(lines[0])
  const out = []
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i])
    const row = {}
    header.forEach((key, index) => {
      row[key] = cells[index] ?? ''
    })
    out.push(row)
  }
  return out
}

function splitCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

function median(sortedOrUnsorted) {
  const sorted = [...sortedOrUnsorted].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 0) return NaN
  const mid = Math.floor(n / 2)
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function modalBorough(names) {
  const counts = new Map()
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1)
  let best = names[0]
  let bestCount = 0
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return best
}

/** Linear-interpolated quantile of a pre-sorted array, p in [0, 1]. */
function linearQuantile(sorted, p) {
  const n = sorted.length
  if (n === 0) return NaN
  const position = p * (n - 1)
  const lo = Math.floor(position)
  const hi = Math.min(lo + 1, n - 1)
  const weight = position - lo
  return sorted[lo] + (sorted[hi] - sorted[lo]) * weight
}

/** Floor-indexed quantile of a pre-sorted array: always an actually-observed value. */
function lowerQuantile(sorted, p) {
  const n = sorted.length
  if (n === 0) return NaN
  const position = Math.floor(p * (n - 1))
  return sorted[position]
}

/** The `bins - 1` breakpoints splitting a pre-sorted array into `bins` equal-count groups. Mirrors lib/viz/scale.ts's quantileBreaks. */
function quantileBreaks(sorted, bins) {
  const breaks = []
  for (let k = 1; k < bins; k += 1) breaks.push(linearQuantile(sorted, k / bins))
  return breaks
}

function renderPriceSurfaceModule({ cellRecords, medianBreaks, sqftBreaks, rowRange, colRange }) {
  // Stored as tuples rather than one object literal per cell: 2,244 repeated key names (r, c,
  // n, med, sqft, b) push the file well past its 90 KB on-disk budget for no informational
  // gain, since every consumer already knows the shape. RAW is unpacked into PriceCell once,
  // at module init.
  const rawLiteral = cellRecords
    .map((cell) => `[${cell.r},${cell.c},${cell.n},${cell.med},${cell.sqft === null ? 'null' : cell.sqft},${cell.b}]`)
    .join(',')

  return `/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-nyc-price-surface.mjs against the public capstone repository:
 * https://github.com/pizonkhan/Springboard-Data-Science, "Capstone 2 - NYC Housing
 * Prediction/Data/final_nyc.csv" (59,350 rows). ${cellRecords.length} cells survive the
 * four-listing floor. No per-listing field, address or owner appears here: every cell is an
 * aggregate of at least four listings.
 */

export interface PriceCell {
  /** Grid indices: round(lat / 0.005), round(lon / 0.005). */
  r: number
  c: number
  /** Listing count in this cell. Always >= 4. */
  n: number
  /** Median list price, USD, rounded to the dollar. */
  med: number
  /** Median $/sqft, USD, rounded. null when fewer than 4 valid rows. */
  sqft: number | null
  /** Modal borough for the cell. */
  b: 0 | 1 | 2 | 3 | 4
}

export const GRID_STEP = ${GRID_STEP}
export const BOROUGH_NAMES = ${JSON.stringify(BOROUGH_NAMES)} as const
export const ROW_RANGE: [number, number] = [${rowRange[0]}, ${rowRange[1]}]
export const COL_RANGE: [number, number] = [${colRange[0]}, ${colRange[1]}]
export const MEDIAN_BREAKS = ${JSON.stringify(medianBreaks)}
export const SQFT_BREAKS = ${JSON.stringify(sqftBreaks)}

/** [r, c, n, med, sqft, b] per cell. See CELLS below for the unpacked, named form every consumer uses. */
const RAW: readonly [number, number, number, number, number | null, 0 | 1 | 2 | 3 | 4][] = [${rawLiteral}]

export const CELLS: readonly PriceCell[] = RAW.map(([r, c, n, med, sqft, b]) => ({ r, c, n, med, sqft, b }))
`
}

function renderBoroughsModule(boroughStats) {
  const rows = boroughStats
    .map((stat) => {
      const deciles = JSON.stringify(stat.deciles)
      return `  {
    name: ${JSON.stringify(stat.name)},
    n: ${stat.n},
    median: ${stat.median},
    mean: ${stat.mean},
    p25: ${stat.p25},
    p75: ${stat.p75},
    medianPerSqft: ${stat.medianPerSqft},
    deciles: ${deciles},
  },`
    })
    .join('\n')

  return `/**
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
${rows}
]
`
}
