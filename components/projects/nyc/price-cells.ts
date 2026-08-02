/**
 * Pure, DOM-free view model for the NYC price surface map. Turns the 2,244 committed cells into
 * map-ready GeoJSON, view metadata and per-step distribution rows. No React, no MapLibre, no
 * colour: `PriceCellMap.tsx` reads this module for geometry and `PriceSurface.tsx` reads it for
 * table data, but nothing here renders anything.
 *
 * Kept free of `@/lib/viz/palette` and `@/lib/theme` on purpose: `vitest.config.ts` runs this
 * file's test in the `node` environment, and both of those modules pull in client-only React.
 */

import { quantileBreaks } from '@/lib/viz/scale'
import {
  BOROUGH_NAMES,
  CELLS,
  MEDIAN_BREAKS,
  SQFT_BREAKS,
  type PriceCell,
} from '@/content/data/nyc-price-surface'

export type SurfaceView = 'density' | 'median' | 'perSqft'
export type BoroughName = (typeof BOROUGH_NAMES)[number]

export const VIEW_OPTIONS: readonly { value: SurfaceView; label: string }[] = [
  { value: 'density', label: 'Density' },
  { value: 'median', label: 'Median price' },
  { value: 'perSqft', label: 'Price per sq ft' },
]

const sortedCounts = CELLS.map((cell) => cell.n).sort((a, b) => a - b)

/** Septile breaks over the 2,244 cell listing counts. Computed, not committed: [8, 14, 20, 27, 34, 46]. */
export const COUNT_BREAKS: readonly number[] = quantileBreaks(sortedCounts, 7)

export function breaksFor(view: SurfaceView): readonly number[] {
  if (view === 'density') return COUNT_BREAKS
  if (view === 'median') return MEDIAN_BREAKS
  return SQFT_BREAKS
}

/** The GeoJSON property name the view's ramp reads: 'n' | 'med' | 'sqft'. */
export function fieldFor(view: SurfaceView): 'n' | 'med' | 'sqft' {
  if (view === 'density') return 'n'
  if (view === 'median') return 'med'
  return 'sqft'
}

export interface CellFeatureProperties {
  /** `${r}:${c}`. The cursor layer's filter key and the lookup back into CELL_BY_KEY. */
  k: string
  /** Listing count in the cell. Always >= 4. */
  n: number
  /** Median list price, USD. */
  med: number
  /** Median $/sqft, USD. The key is ABSENT, never null, when the cell has no valid value. */
  sqft?: number
  /** Index into BOROUGH_NAMES. */
  b: number
}

export type CellFeature = GeoJSON.Feature<GeoJSON.Polygon, CellFeatureProperties>

export function cellKey(cell: Pick<PriceCell, 'r' | 'c'>): string {
  return `${cell.r}:${cell.c}`
}

/**
 * Snaps to the nearest double representable at four decimal places. `c * 0.005` and `r * 0.005`
 * land on values like `-73.96000000000001` in binary floating point; this is what keeps every
 * serialised coordinate four decimal places long. It does not guarantee that multiplying back by
 * `1e4` lands on an exact integer, only that the value round-trips through `toFixed(4)`.
 */
const round4 = (v: number) => Math.round(v * 1e4) / 1e4

function ringFor(cell: Pick<PriceCell, 'r' | 'c'>): GeoJSON.Position[] {
  const west = round4(cell.c * 0.005 - 0.0025)
  const east = round4(cell.c * 0.005 + 0.0025)
  const south = round4(cell.r * 0.005 - 0.0025)
  const north = round4(cell.r * 0.005 + 0.0025)
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ]
}

function toFeature(cell: PriceCell): CellFeature {
  const properties: CellFeatureProperties = {
    k: cellKey(cell),
    n: cell.n,
    med: cell.med,
    ...(cell.sqft !== null ? { sqft: cell.sqft } : {}),
    b: cell.b,
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ringFor(cell)] },
    properties,
  }
}

/** Built once at module init from CELLS. 2,244 features. */
export const CELL_COLLECTION: GeoJSON.FeatureCollection<GeoJSON.Polygon, CellFeatureProperties> = {
  type: 'FeatureCollection',
  features: CELLS.map(toFeature),
}

/** `${r}:${c}` -> PriceCell, for the readout. */
export const CELL_BY_KEY: ReadonlyMap<string, PriceCell> = new Map(
  CELLS.map((cell) => [cellKey(cell), cell]),
)

function outerEdges(): { west: number; south: number; east: number; north: number } {
  let minR = Infinity
  let maxR = -Infinity
  let minC = Infinity
  let maxC = -Infinity
  for (const cell of CELLS) {
    if (cell.r < minR) minR = cell.r
    if (cell.r > maxR) maxR = cell.r
    if (cell.c < minC) minC = cell.c
    if (cell.c > maxC) maxC = cell.c
  }
  return {
    west: round4(minC * 0.005 - 0.0025),
    south: round4(minR * 0.005 - 0.0025),
    east: round4(maxC * 0.005 + 0.0025),
    north: round4(maxR * 0.005 + 0.0025),
  }
}

const { west, south, east, north } = outerEdges()

/**
 * [[west, south], [east, north]] over the surviving cells' outer edges. Declared as a MUTABLE
 * tuple, not `readonly`: MapLibre's `LngLatBoundsLike` is `[LngLatLike, LngLatLike]`, and a
 * readonly tuple is not assignable to it, so `readonly` here fails `npm run typecheck` at the
 * `new maplibregl.Map({ bounds: DATA_BOUNDS })` call site. Same declaration style as
 * `SalesMap.tsx`'s `BOUNDS`.
 */
export const DATA_BOUNDS: [[number, number], [number, number]] = [
  [west, south],
  [east, north],
]

export interface RampStepRow {
  /** 0..6, matching SEQ. */
  index: number
  /** null on step 0. */
  lower: number | null
  /** null on step 6. */
  upper: number | null
  cells: number
  listings: number
}

export interface RampStepSummary {
  rows: readonly RampStepRow[]
  /** Cells the active view cannot colour (perSqft only). */
  noValueCells: number
  noValueListings: number
}

/**
 * Buckets every cell into its ramp step for `view`. Half-open on the left, matching
 * `rampIndexFor` in `lib/viz/palette.ts` and MapLibre's own `step` expression: a cell whose value
 * equals a break sits in the step above it, so the legend, the map and this table cannot disagree.
 */
export function rampStepRows(view: SurfaceView): RampStepSummary {
  const breaks = breaksFor(view)
  const field = fieldFor(view)

  const rows: RampStepRow[] = []
  for (let index = 0; index <= breaks.length; index += 1) {
    rows.push({
      index,
      lower: index === 0 ? null : breaks[index - 1],
      upper: index === breaks.length ? null : breaks[index],
      cells: 0,
      listings: 0,
    })
  }

  let noValueCells = 0
  let noValueListings = 0

  for (const cell of CELLS) {
    const value = field === 'n' ? cell.n : field === 'med' ? cell.med : cell.sqft
    if (value === null) {
      noValueCells += 1
      noValueListings += cell.n
      continue
    }
    let index = 0
    for (const breakpoint of breaks) {
      if (value >= breakpoint) index += 1
    }
    rows[index].cells += 1
    rows[index].listings += cell.n
  }

  return { rows, noValueCells, noValueListings }
}
