#!/usr/bin/env node
/**
 * Turns the New York City Department of Finance's calendar-2025 sales slice into the five
 * committed artefacts the map runs on: content/data/nyc-2025-sales.ts,
 * content/data/nyc-2025-neighborhoods.ts, public/projects/nyc-home-sales-2025/points.json and
 * the five per-borough detail shards under public/projects/nyc-home-sales-2025/detail/.
 *
 * Source: NYC Open Data, "NYC Citywide Annualized Calendar Sales Update", dataset id
 * w2pb-icbu, published by the New York City Department of Finance.
 * https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu
 *
 * Download (about 16 MB, calendar 2025 only):
 *   curl -sSG "https://data.cityofnewyork.us/resource/w2pb-icbu.csv" \
 *     --data-urlencode '$select=sale_date,sale_price,borough,neighborhood,building_class_category,building_class_at_time_of,address,apartment_number,zip_code,residential_units,total_units,land_square_feet,gross_square_feet,year_built,latitude,longitude,bbl,nta' \
 *     --data-urlencode "\$where=sale_date>='2025-01-01'" \
 *     --data-urlencode '$limit=100000' \
 *     -o .data/nyc-sales-2025.csv
 *
 * PLUTO fallback, documented and not built: if a future snapshot's geocoding coverage drops
 * below 90%, join the gap on BBL to NYC Primary Land Use Tax Lot Output (`64uk-42ks`), which
 * carries `latitude` and `longitude` per lot. This dataset does not need that today: its own
 * coverage is 98%.
 *
 * Usage:
 *   node scripts/build-nyc-sales-2025.mjs [path-to-csv]
 * With no argument, downloads the documented query to .data/nyc-sales-2025.csv (reusing the
 * file if it is already there) and runs against that.
 *
 * Run manually, once, by Pizon. Never wired into `npm run build` or any CI workflow, exactly
 * like scripts/build-nyc-price-surface.mjs and scripts/build-bird-assets.py. No BBL, owner,
 * buyer, seller or document field is written into any committed file: BBL is read only so a
 * future PLUTO join has a key, never shipped.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const YEAR = 2025
const SODA_URL =
  'https://data.cityofnewyork.us/resource/w2pb-icbu.csv'
  + '?$select=sale_date,sale_price,borough,neighborhood,building_class_category,'
  + 'building_class_at_time_of,address,apartment_number,zip_code,residential_units,'
  + 'total_units,land_square_feet,gross_square_feet,year_built,latitude,longitude,bbl,nta'
  + `&$where=${encodeURIComponent(`sale_date>='${YEAR}-01-01'`)}`
  + '&$limit=100000'

const PRICE_FILTER = { min: 100_000, max: 10_000_000 }

// Borough index 0..4, the order the DOF's own borough code (1..5) minus one gives.
const BOROUGH_NAMES = ['Manhattan', 'Bronx', 'Brooklyn', 'Queens', 'Staten Island']
const BOROUGH_SLUGS = ['manhattan', 'bronx', 'brooklyn', 'queens', 'staten-island']

const CLASS_CODES = ['01', '02', '03', '04', '09', '10', '12', '13', '15', '17']
const CLASS_LABELS = {
  '01': 'One family dwelling',
  '02': 'Two family dwelling',
  '03': 'Three family dwelling',
  '04': 'Tax class 1 condo',
  '09': 'Co-op, walkup apartment',
  '10': 'Co-op, elevator apartment',
  '12': 'Condo, walkup apartment',
  '13': 'Condo, elevator apartment',
  '15': 'Condo, 2 to 10 unit residential',
  '17': 'Condo co-op',
}
const CLASS_GROUPS = {
  houses: ['01', '02', '03'],
  condos: ['04', '12', '13', '15'],
  coops: ['09', '10', '17'],
}

const NEIGHBORHOOD_FLOOR = 4
const SQFT_ROWS_FLOOR = 4

// The delta encoding's fixed reference point and quantisation step: 1e-5 degree, about 1.1 m,
// which is well under the map's smallest dot (3 px at zoom 16).
const SCALE = 100_000

async function main() {
  const inputPath = await resolveInputPath(process.argv[2])
  const csvText = readFileSync(inputPath, 'utf-8')
  const inputSha256 = createHash('sha256').update(csvText).digest('hex')
  console.log(`Input: ${inputPath}`)
  console.log(`SHA-256: ${inputSha256}`)

  const rows = parseCsv(csvText)
  console.log(`Parsed ${rows.length} rows`)

  // --- Filter chain, printed at every step, in the Data section's exact order -------------

  const inYear = rows.filter((row) => {
    const year = parseSaleDate(row.sale_date)?.year
    return year === YEAR
  })
  console.log(`1. sale_date within calendar ${YEAR}: ${inYear.length}`)

  const geocoded = inYear.filter((row) => {
    const lat = Number(row.latitude)
    const lon = Number(row.longitude)
    return row.latitude !== '' && row.longitude !== '' && Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0
  })
  console.log(`2. latitude and longitude present and non-zero: ${geocoded.length}`)

  const geocodingCoverage = geocoded.length / inYear.length

  const priced = geocoded.filter((row) => {
    const price = Number(row.sale_price)
    return Number.isFinite(price) && price >= PRICE_FILTER.min && price <= PRICE_FILTER.max
  })
  console.log(`3. ${PRICE_FILTER.min} <= sale_price <= ${PRICE_FILTER.max}: ${priced.length}`)

  const classSet = new Set(CLASS_CODES)
  const surviving = priced.filter((row) => classSet.has(row.building_class_category.slice(0, 2)))
  console.log(`4. building_class_category in ${CLASS_CODES.join(' ')}: ${surviving.length}`)

  for (const row of surviving) {
    const code = row.building_class_category.slice(0, 2)
    if (!(code in CLASS_LABELS)) {
      console.error(`Unrecognised building_class_category code "${code}" survived the filter. Update CLASS_LABELS or the filter list.`)
      process.exit(1)
    }
  }

  // --- Parse the surviving rows into typed points -----------------------------------------

  const points = surviving
    .map((row) => {
      const parsedDate = parseSaleDate(row.sale_date)
      return {
        lat: Number(row.latitude),
        lon: Number(row.longitude),
        price: Number(row.sale_price),
        classIndex: CLASS_CODES.indexOf(row.building_class_category.slice(0, 2)),
        boroughIndex: Number(row.borough) - 1,
        month: parsedDate.month,
        day: parsedDate.dayOfYear,
        neighborhood: row.neighborhood.trim(),
        address: row.address.trim(),
        apartment: row.apartment_number.trim(),
        zip: row.zip_code.trim(),
        grossSqFt: parseThousands(row.gross_square_feet),
        yearBuilt: Number(row.year_built) || 0,
      }
    })
    .filter((p) => p.boroughIndex >= 0 && p.boroughIndex < 5)

  if (points.length !== surviving.length) {
    console.error(`${surviving.length - points.length} surviving rows carried a borough code outside 1..5.`)
    process.exit(1)
  }

  // --- Sanity bands, criterion 12: stop rather than write a wrong module ------------------

  const failures = []
  if (geocodingCoverage < 0.9) {
    failures.push(`geocoding coverage ${(geocodingCoverage * 100).toFixed(1)}% is below 90%`)
  }
  if (points.length < 30_000 || points.length > 60_000) {
    failures.push(`${points.length} surviving points is outside 30,000..60,000`)
  }
  const citywideMedian = Math.round(linearQuantile(points.map((p) => p.price).sort((a, b) => a - b), 0.5))
  if (citywideMedian < 500_000 || citywideMedian > 1_500_000) {
    failures.push(`citywide median $${citywideMedian} is outside $500,000..$1,500,000`)
  }
  for (let b = 0; b < 5; b += 1) {
    const n = points.filter((p) => p.boroughIndex === b).length
    if (n < 500) failures.push(`${BOROUGH_NAMES[b]} has only ${n} sales, fewer than 500`)
  }

  const neighborhoodGroups = groupNeighborhoods(points)
  const neighborhoodsAboveFloor = [...neighborhoodGroups.values()].filter((g) => g.length >= NEIGHBORHOOD_FLOOR)
  if (neighborhoodsAboveFloor.length < 150) {
    failures.push(`only ${neighborhoodsAboveFloor.length} neighbourhoods clear the four-sale floor, fewer than 150`)
  }

  if (failures.length > 0) {
    console.error('Sanity bands failed. Nothing written.')
    for (const reason of failures) console.error(`  - ${reason}`)
    process.exit(1)
  }

  // --- Borough aggregates -------------------------------------------------------------------

  const boroughStats = BOROUGH_NAMES.map((name, b) => {
    const members = points.filter((p) => p.boroughIndex === b)
    const prices = members.map((p) => p.price).sort((a, b2) => a - b2)
    const perSqFt = members
      .filter((p) => p.grossSqFt > 0)
      .map((p) => p.price / p.grossSqFt)
      .sort((a, b2) => a - b2)
    return {
      name,
      n: members.length,
      median: Math.round(linearQuantile(prices, 0.5)),
      p25: Math.round(linearQuantile(prices, 0.25)),
      p75: Math.round(linearQuantile(prices, 0.75)),
      medianPerSqFt: perSqFt.length >= SQFT_ROWS_FLOOR ? Math.round(linearQuantile(perSqFt, 0.5)) : 0,
      perSqFtRows: perSqFt.length,
    }
  })

  const allPrices = points.map((p) => p.price).sort((a, b) => a - b)
  const citywide = {
    median: Math.round(linearQuantile(allPrices, 0.5)),
    p25: Math.round(linearQuantile(allPrices, 0.25)),
    p75: Math.round(linearQuantile(allPrices, 0.75)),
  }
  const priceBreaks = quantileBreaks(allPrices, 7).map(Math.round)
  console.log('CITYWIDE_2025', citywide)
  console.log('PRICE_BREAKS', priceBreaks)

  const dates = points.map((p) => p.day).sort((a, b) => a - b)
  const first = dayOffsetToDate(dates[0])
  const last = dayOffsetToDate(dates[dates.length - 1])

  const generatedAt = new Date().toISOString().slice(0, 10)

  const snapshot = {
    generatedAt,
    inputSha256,
    year: YEAR,
    first,
    last,
    rowsDownloaded: inYear.length,
    rowsGeocoded: geocoded.length,
    rowsInPriceBracket: priced.length,
    points: points.length,
  }

  console.log('SNAPSHOT', snapshot)
  for (const stat of boroughStats) console.log('BOROUGH', stat)

  writeFileSync(
    resolveRepoPath('content/data/nyc-2025-sales.ts'),
    renderSalesModule({ snapshot, boroughStats, citywide, priceBreaks }),
  )

  // --- Neighbourhood aggregates ------------------------------------------------------------

  const neighborhoodStats = [...neighborhoodGroups.entries()]
    .map(([key, members]) => {
      const [b, name] = splitNeighborhoodKey(key)
      const prices = members.map((p) => p.price).sort((a, b2) => a - b2)
      const perSqFtValues = members
        .filter((p) => p.grossSqFt > 0)
        .map((p) => p.price / p.grossSqFt)
        .sort((a, b2) => a - b2)
      const perSqFtRows = perSqFtValues.length
      return {
        name,
        b,
        n: members.length,
        median: Math.round(linearQuantile(prices, 0.5)),
        p25: Math.round(linearQuantile(prices, 0.25)),
        p75: Math.round(linearQuantile(prices, 0.75)),
        perSqFt: perSqFtRows >= SQFT_ROWS_FLOOR ? Math.round(linearQuantile(perSqFtValues, 0.5)) : null,
        perSqFtRows: perSqFtRows >= SQFT_ROWS_FLOOR ? perSqFtRows : null,
        lat: round5(mean(members.map((p) => p.lat))),
        lon: round5(mean(members.map((p) => p.lon))),
      }
    })
    .filter((row) => row.n >= NEIGHBORHOOD_FLOOR)
    .sort((a, b2) => b2.median - a.median)

  console.log(`${neighborhoodStats.length} neighbourhoods clear the ${NEIGHBORHOOD_FLOOR}-sale floor`)
  const highest = neighborhoodStats[0]
  const lowest = neighborhoodStats[neighborhoodStats.length - 1]
  console.log(`Highest median: ${highest.name} (borough ${highest.b}) at $${highest.median} over ${highest.n} sales`)
  console.log(`Lowest median: ${lowest.name} (borough ${lowest.b}) at $${lowest.median} over ${lowest.n} sales`)

  writeFileSync(resolveRepoPath('content/data/nyc-2025-neighborhoods.ts'), renderNeighborhoodsModule(neighborhoodStats))

  // --- points.json: sort by (y, x, price), delta-encode --------------------------------

  // Floored, not rounded: the origin must sit at or below every point's true coordinate, or
  // the lowest point would delta-encode to a negative offset.
  const originLat = floor5(Math.min(...points.map((p) => p.lat)))
  const originLon = floor5(Math.min(...points.map((p) => p.lon)))

  const encoded = points.map((p) => ({
    ...p,
    y: Math.round((p.lat - originLat) * SCALE),
    x: Math.round((p.lon - originLon) * SCALE),
  }))
  encoded.sort((a, b) => (a.y - b.y) || (a.x - b.x) || (a.price - b.price))

  const dy = []
  const dx = []
  const p = []
  const c = []
  const b = []
  const m = []
  let prevY = 0
  let prevX = 0
  encoded.forEach((pt, i) => {
    dy.push(i === 0 ? pt.y : pt.y - prevY)
    dx.push(i === 0 ? pt.x : pt.x - prevX)
    prevY = pt.y
    prevX = pt.x
    p.push(pt.price)
    c.push(pt.classIndex)
    b.push(pt.boroughIndex)
    m.push(pt.month)
  })

  const pointsPayload = {
    version: 1,
    generatedAt,
    year: YEAR,
    first,
    last,
    n: encoded.length,
    origin: { lon: originLon, lat: originLat },
    scale: SCALE,
    dy,
    dx,
    p,
    c,
    b,
    m,
  }

  const pointsDir = resolveRepoPath('public/projects/nyc-home-sales-2025')
  mkdirSync(pointsDir, { recursive: true })
  writeFileSync(path.join(pointsDir, 'points.json'), JSON.stringify(pointsPayload))

  // --- Per-borough detail shards, keyed by the same global index the points array now has --

  const detailDir = path.join(pointsDir, 'detail')
  mkdirSync(detailDir, { recursive: true })

  for (let boroughIndex = 0; boroughIndex < 5; boroughIndex += 1) {
    const indices = []
    const a = []
    const u = []
    const z = []
    const d = []
    const g = []
    const y = []
    const nb = []
    const neighborhoodNames = [
      ...new Set(encoded.filter((pt) => pt.boroughIndex === boroughIndex).map((pt) => pt.neighborhood)),
    ].sort()

    encoded.forEach((pt, globalIndex) => {
      if (pt.boroughIndex !== boroughIndex) return
      indices.push(globalIndex)
      a.push(pt.address)
      u.push(pt.apartment)
      z.push(pt.zip)
      d.push(pt.day)
      g.push(pt.grossSqFt)
      y.push(pt.yearBuilt)
      nb.push(neighborhoodNames.indexOf(pt.neighborhood))
    })

    const shard = {
      borough: BOROUGH_NAMES[boroughIndex],
      boroughIndex,
      index: indices,
      a,
      u,
      z,
      d,
      g,
      y,
      neighborhoods: neighborhoodNames,
      nb,
    }
    writeFileSync(path.join(detailDir, `${BOROUGH_SLUGS[boroughIndex]}.json`), JSON.stringify(shard))
    console.log(`Wrote detail/${BOROUGH_SLUGS[boroughIndex]}.json: ${indices.length} sales, ${neighborhoodNames.length} neighbourhoods`)
  }

  console.log('Wrote content/data/nyc-2025-sales.ts, content/data/nyc-2025-neighborhoods.ts, points.json and five detail shards.')
}

// --- helpers ---------------------------------------------------------------------------

async function resolveInputPath(argPath) {
  if (argPath) return argPath
  const target = resolveRepoPath('.data/nyc-sales-2025.csv')
  if (existsSync(target)) {
    console.log(`Reusing existing download at ${target}`)
    return target
  }
  console.log(`Downloading ${SODA_URL}`)
  const res = await fetch(SODA_URL)
  if (!res.ok) {
    console.error(`Download failed: HTTP ${res.status}`)
    process.exit(1)
  }
  const text = await res.text()
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, text)
  console.log(`Saved ${target}`)
  return target
}

function resolveRepoPath(relative) {
  const here = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(here, '..', relative)
}

/** Minimal CSV parser. Handles quoted fields containing commas, which several DOF columns do. */
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

/** Strips thousands separators (DOF ships "2,021") and treats 0 as "not recorded". */
function parseThousands(text) {
  const n = Number(String(text).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** sale_date arrives as "2025-01-01T00:00:00.000". Returns UTC year, 0-indexed month, and the day offset from January 1 of that year. */
function parseSaleDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (!match) return { year: NaN, month: NaN, dayOfYear: NaN }
  const [, y, mo, d] = match
  const year = Number(y)
  const date = Date.UTC(year, Number(mo) - 1, Number(d))
  const jan1 = Date.UTC(year, 0, 1)
  return { year, month: Number(mo) - 1, dayOfYear: Math.round((date - jan1) / 86_400_000) }
}

function dayOffsetToDate(dayOffset) {
  const d = new Date(Date.UTC(YEAR, 0, 1) + dayOffset * 86_400_000)
  return d.toISOString().slice(0, 10)
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function round5(n) {
  return Math.round(n * 100_000) / 100_000
}

function floor5(n) {
  return Math.floor(n * 100_000) / 100_000
}

/** Linear-interpolated quantile of a pre-sorted array, p in [0, 1]. Matches numpy.percentile's default. */
function linearQuantile(sorted, p) {
  const n = sorted.length
  if (n === 0) return NaN
  const position = p * (n - 1)
  const lo = Math.floor(position)
  const hi = Math.min(lo + 1, n - 1)
  const weight = position - lo
  return sorted[lo] + (sorted[hi] - sorted[lo]) * weight
}

/** The `bins - 1` breakpoints splitting a pre-sorted array into `bins` equal-count groups. */
function quantileBreaks(sorted, bins) {
  const breaks = []
  for (let k = 1; k < bins; k += 1) breaks.push(linearQuantile(sorted, k / bins))
  return breaks
}

function neighborhoodKeyOf(boroughIndex, name) {
  return `${boroughIndex}:${name}`
}

function splitNeighborhoodKey(key) {
  const i = key.indexOf(':')
  return [Number(key.slice(0, i)), key.slice(i + 1)]
}

function groupNeighborhoods(points) {
  const groups = new Map()
  for (const p of points) {
    const key = neighborhoodKeyOf(p.boroughIndex, p.neighborhood)
    let members = groups.get(key)
    if (!members) {
      members = []
      groups.set(key, members)
    }
    members.push(p)
  }
  return groups
}

function renderSalesModule({ snapshot, boroughStats, citywide, priceBreaks }) {
  const boroughLiteral = boroughStats
    .map(
      (s) => `  {
    name: ${JSON.stringify(s.name)},
    n: ${s.n},
    median: ${s.median},
    p25: ${s.p25},
    p75: ${s.p75},
    medianPerSqFt: ${s.medianPerSqFt},
    perSqFtRows: ${s.perSqFtRows},
  },`,
    )
    .join('\n')

  const classLabelLines = CLASS_CODES.map((code) => `  '${code}': ${JSON.stringify(CLASS_LABELS[code])},`).join('\n')

  return `/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-nyc-sales-2025.mjs against NYC Open Data's "NYC Citywide
 * Annualized Calendar Sales Update" (dataset id w2pb-icbu), New York City Department of
 * Finance: https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu
 * Calendar ${snapshot.year}, filtered to residential building classes and a $100,000 to
 * $10,000,000 sale price, geocoded. ${snapshot.points} sales survive.
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
  generatedAt: ${JSON.stringify(snapshot.generatedAt)},
  /** SHA-256 of the input CSV, so a rerun can be proven identical. */
  inputSha256: ${JSON.stringify(snapshot.inputSha256)},
  year: ${snapshot.year},
  first: ${JSON.stringify(snapshot.first)},
  last: ${JSON.stringify(snapshot.last)},
  rowsDownloaded: ${snapshot.rowsDownloaded},
  rowsGeocoded: ${snapshot.rowsGeocoded},
  rowsInPriceBracket: ${snapshot.rowsInPriceBracket},
  points: ${snapshot.points},
} as const

export const PRICE_FILTER = { min: ${PRICE_FILTER.min}, max: ${PRICE_FILTER.max} } as const

export const CLASS_CODES = ${JSON.stringify(CLASS_CODES)} as const

export const CLASS_LABELS: Record<string, string> = {
${classLabelLines}
}

export const CLASS_GROUPS = {
  houses: ${JSON.stringify(CLASS_GROUPS.houses)},
  condos: ${JSON.stringify(CLASS_GROUPS.condos)},
  coops: ${JSON.stringify(CLASS_GROUPS.coops)},
} as const

export const BOROUGHS_2025: readonly BoroughStat2025[] = [
${boroughLiteral}
]

export const CITYWIDE_2025 = { median: ${citywide.median}, p25: ${citywide.p25}, p75: ${citywide.p75} } as const

/** Septiles of the point price distribution: the six ramp breakpoints. */
export const PRICE_BREAKS: readonly number[] = ${JSON.stringify(priceBreaks)}
`
}

function renderNeighborhoodsModule(rows) {
  // Stored as tuples rather than one object literal per row: 245 rows of repeated key names
  // (name, b, n, median, p25, p75, perSqFt, perSqFtRows, lat, lon) push the file well past its
  // 45,000-byte on-disk budget for no informational gain, since every consumer already knows
  // the shape. RAW is unpacked into NEIGHBORHOODS_2025 once, at module init, the same pattern
  // content/data/nyc-price-surface.ts uses for its cells.
  const rawLiteral = rows
    .map(
      (r) => `[${JSON.stringify(r.name)},${r.b},${r.n},${r.median},${r.p25},${r.p75},`
        + `${r.perSqFt === null ? 'null' : r.perSqFt},${r.perSqFtRows === null ? 'null' : r.perSqFtRows},`
        + `${r.lat},${r.lon}]`,
    )
    .join(',')

  return `/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-nyc-sales-2025.mjs against NYC Open Data's "NYC Citywide
 * Annualized Calendar Sales Update" (dataset id w2pb-icbu), New York City Department of
 * Finance. Rows are grouped by (borough, name) as the Department of Finance spells it, then
 * dropped below a four-sale floor. ${rows.length} neighbourhoods survive.
 */

export interface NeighborhoodStat {
  /**
   * As the Department of Finance spells it, e.g. 'UPPER WEST SIDE (79-96)'. NOT unique on its
   * own: rows are keyed by (b, name), because the same name recurs across boroughs.
   */
  name: string
  /** 0..4 into BOROUGHS_2025. */
  b: number
  n: number
  median: number
  p25: number
  p75: number
  /** null when fewer than 4 rows record a gross square footage. */
  perSqFt: number | null
  /**
   * How many rows perSqFt was computed from, null exactly when perSqFt is null. The
   * neighbourhood table prints it under the figure: some of these denominators are thin and
   * hiding that would be dishonest.
   */
  perSqFtRows: number | null
  /** Mean of the member sales' coordinates, 5 decimal places. Used to fly the map. */
  lat: number
  lon: number
}

/** [name, b, n, median, p25, p75, perSqFt, perSqFtRows, lat, lon] per row. See NEIGHBORHOODS_2025 below for the unpacked, named form every consumer uses. */
const RAW: readonly [string, number, number, number, number, number, number | null, number | null, number, number][] = [${rawLiteral}]

export const NEIGHBORHOODS_2025: readonly NeighborhoodStat[] = RAW.map(
  ([name, b, n, median, p25, p75, perSqFt, perSqFtRows, lat, lon]) => (
    { name, b, n, median, p25, p75, perSqFt, perSqFtRows, lat, lon }
  ),
)
`
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
