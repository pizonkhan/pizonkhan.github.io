'use client'

import { useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { ScaleLegend } from '@/components/viz/ScaleLegend'
import { formatCompactUSD, formatCount, formatUSD } from '@/lib/format'
import { rampIndexFor, SEQ } from '@/lib/viz/palette'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import { BOROUGH_NAMES, CELLS, type PriceCell } from '@/content/data/nyc-price-surface'
import { BOROUGHS, type BoroughStat } from '@/content/data/nyc-boroughs'
import {
  breaksFor,
  CELL_BY_KEY,
  CELL_COLLECTION,
  rampStepRows,
  VIEW_OPTIONS,
  type BoroughName,
  type RampStepSummary,
  type SurfaceView,
} from './price-cells'
import { PriceCellMap } from './PriceCellMap'
import { BoroughTable } from './BoroughTable'

export type { SurfaceView, BoroughName } from './price-cells'

export interface PriceSurfaceProps {
  /** Defaults to 'median'. Present so a future route can deep-link a view. */
  initialView?: SurfaceView
}

const SUMMARY_ID = 'price-surface-summary'

const VIEW_VALUES = VIEW_OPTIONS.map((option) => option.value)

const STAT_LABEL: Record<SurfaceView, string> = {
  density: 'listing count',
  median: 'median list price',
  perSqft: 'median price per square foot',
}

const STEP_TABLE_CAPTION: Record<SurfaceView, string> = {
  density: "How the map's seven density steps break down, cell by cell.",
  median: "How the map's seven median-price steps break down, cell by cell.",
  perSqft: "How the map's seven price-per-square-foot steps break down, cell by cell.",
}

function stepValue(view: SurfaceView, value: number): string {
  if (view === 'density') return formatCount(value)
  if (view === 'median') return formatUSD(value)
  return `$${value}`
}

function rangeLabel(view: SurfaceView, lower: number | null, upper: number | null): string {
  if (lower !== null && upper !== null) return `${stepValue(view, lower)} to ${stepValue(view, upper)}`
  if (upper !== null) return `under ${stepValue(view, upper)}`
  if (lower !== null) return `${stepValue(view, lower)} and above`
  return ''
}

function legendLabelsFor(view: SurfaceView): string[] {
  const breaks = breaksFor(view)
  if (view === 'density') return breaks.map((value) => formatCount(value))
  if (view === 'median') return breaks.map((value) => formatCompactUSD(value))
  return breaks.map((value) => `$${value}`)
}

function legendHighlightIndex(
  view: SurfaceView,
  activeCell: PriceCell | undefined,
  focusedStat: BoroughStat | undefined,
): number | null {
  if (activeCell) {
    const value = view === 'density' ? activeCell.n : view === 'median' ? activeCell.med : activeCell.sqft
    if (value === null) return null
    return rampIndexFor(value, breaksFor(view))
  }
  if (focusedStat) {
    // Density has no borough-level equivalent: a borough's total listing count is not a cell
    // count, so a focused borough highlights nothing on that ramp.
    if (view === 'median') return rampIndexFor(focusedStat.median, breaksFor('median'))
    if (view === 'perSqft') return rampIndexFor(focusedStat.medianPerSqft, breaksFor('perSqft'))
    return null
  }
  return null
}

function buildSummaryText(view: SurfaceView, rampSummary: RampStepSummary): string {
  const breaks = breaksFor(view)
  const shownCells = CELL_COLLECTION.features.length - rampSummary.noValueCells
  const rangeText = `${rangeLabel(view, null, breaks[0])} to ${rangeLabel(view, breaks[breaks.length - 1], null)}`

  const sentences = [
    `Showing ${formatCount(shownCells)} cells across New York City, coloured in seven steps by ` +
      `${STAT_LABEL[view]}, from ${rangeText}.`,
  ]
  if (view === 'perSqft') {
    sentences.push(
      `${formatCount(rampSummary.noValueCells)} cells have too few valid rows to carry a price per ` +
        'square foot, and are drawn as an outline with no fill.',
    )
  }
  sentences.push(
    'Hovering or tapping a cell reads out its listing count, median and price per square foot.',
    "The borough table below this map is not filtered by the view control, and the figure's own " +
      'tables break every step down by cell count and listing count.',
  )
  return sentences.join(' ')
}

/**
 * The centrepiece: 2,244 aggregated cells drawn at their real coordinates on a MapLibre basemap,
 * coloured by listing density, median list price or median price per square foot. Owns the
 * WebGL probe, the Figure wrapper, the view radiogroup, the legend, the persistent readout, the
 * always-visible BoroughTable, both accessible tables and the WebGL-absent fallback. Delegates
 * every map draw call to PriceCellMap.
 */
export function PriceSurface({ initialView = 'median' }: PriceSurfaceProps) {
  const [view, setView] = useState<SurfaceView>(initialView)
  const [focusBorough, setFocusBorough] = useState<BoroughName | null>(null)
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [pinnedKey, setPinnedKey] = useState<string | null>(null)
  const [webglOk] = useState(() => (typeof document === 'undefined' ? true : hasWebgl()))
  const [mapFailed, setMapFailed] = useState(false)

  const activeKey = pinnedKey ?? hoverKey
  const activeCell = activeKey ? CELL_BY_KEY.get(activeKey) : undefined
  const showMap = webglOk && !mapFailed

  const handleHoverCell = useCallback((key: string | null) => {
    setHoverKey((prev) => (prev === key ? prev : key))
  }, [])

  const handleSelectCell = useCallback((key: string | null) => {
    setPinnedKey((prev) => (key === null ? null : prev === key ? null : key))
  }, [])

  const handleUnavailable = useCallback(() => setMapFailed(true), [])

  const priceExtent = useMemo(() => {
    const medians = CELLS.map((cell) => cell.med)
    return [Math.min(...medians), Math.max(...medians)] as const
  }, [])

  const totalListings = useMemo(() => CELLS.reduce((sum, cell) => sum + cell.n, 0), [])

  const extremeCells = useMemo(() => {
    let highest = CELLS[0]
    let lowest = CELLS[0]
    for (const cell of CELLS) {
      if (cell.med > highest.med) highest = cell
      if (cell.med < lowest.med) lowest = cell
    }
    return { highest, lowest }
  }, [])

  const focusedStat: BoroughStat | undefined = focusBorough
    ? BOROUGHS.find((b) => b.name === focusBorough)
    : undefined

  const rampSummary = rampStepRows(view)
  const summaryText = buildSummaryText(view, rampSummary)

  const boroughFigureRows = BOROUGHS.map((borough) => ({
    borough: borough.name,
    listings: formatCount(borough.n),
    median: formatUSD(borough.median),
    mean: formatUSD(borough.mean),
    p25: formatUSD(borough.p25),
    p75: formatUSD(borough.p75),
    perSqft: `$${borough.medianPerSqft}`,
  }))

  const stepFigureRows = rampSummary.rows.map((row) => ({
    step: String(row.index + 1),
    range: rangeLabel(view, row.lower, row.upper),
    cells: formatCount(row.cells),
    listings: formatCount(row.listings),
  }))

  return (
    <div className="flex flex-col gap-4">
      <Figure
        eyebrow="59,350 LISTINGS"
        title="New York, coloured by what it was asking"
        caption="Each square is real ground, coloured by the listings standing on it. Zoom in and the streets come up underneath."
        source="Zillow 2019 NYC extract, 59,350 cleaned listings aggregated into 2,244 cells of at least four listings each. Basemap: OpenFreeMap, OpenMapTiles, data from OpenStreetMap."
        well={{ height: 560, heightSm: 620 }}
        controls={<ViewControl value={view} onChange={setView} />}
        table={
          <div className="flex flex-col gap-4">
            <FigureTable
              caption="Listings, price and spread by borough, from the same cells the map draws."
              columns={[
                { key: 'borough', label: 'Borough' },
                { key: 'listings', label: 'Listings', align: 'right' },
                { key: 'median', label: 'Median', align: 'right' },
                { key: 'mean', label: 'Mean', align: 'right' },
                { key: 'p25', label: 'P25', align: 'right' },
                { key: 'p75', label: 'P75', align: 'right' },
                { key: 'perSqft', label: 'Median $/sqft', align: 'right' },
              ]}
              rows={boroughFigureRows}
            />
            <p className="text-small text-text-secondary">
              The highest-priced cell on the map has a median list price of {formatUSD(extremeCells.highest.med)}, in{' '}
              {BOROUGH_NAMES[extremeCells.highest.b]}. The lowest is {formatUSD(extremeCells.lowest.med)}, in{' '}
              {BOROUGH_NAMES[extremeCells.lowest.b]}.
            </p>
            <FigureTable
              caption={STEP_TABLE_CAPTION[view]}
              columns={[
                { key: 'step', label: 'Step' },
                { key: 'range', label: 'Range' },
                { key: 'cells', label: 'Cells', align: 'right' },
                { key: 'listings', label: 'Listings', align: 'right' },
              ]}
              rows={stepFigureRows}
            />
          </div>
        }
      >
        <p id={SUMMARY_ID} className="sr-only">
          {summaryText}
        </p>
        {showMap ? (
          <PriceCellMap
            view={view}
            focusBorough={focusBorough}
            activeKey={activeKey}
            onHoverCell={handleHoverCell}
            onSelectCell={handleSelectCell}
            summaryId={SUMMARY_ID}
            onUnavailable={handleUnavailable}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <p className="max-w-sm text-body text-text-secondary">
              This map needs WebGL, which this browser has turned off. Every figure it shows is in the tables below.
            </p>
          </div>
        )}
      </Figure>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1 max-w-sm">
          <ScaleLegend
            colors={SEQ}
            breakLabels={legendLabelsFor(view)}
            lowLabel="Lower"
            highLabel="Higher"
            highlightIndex={legendHighlightIndex(view, activeCell, focusedStat)}
          />
          <p className="text-tick text-text-tertiary">
            Each square is one 0.005 degree cell, about 0.35 miles north to south and 0.26 miles across.
          </p>
        </div>
        <Readout
          activeCell={activeCell}
          focusedStat={focusedStat}
          priceExtent={priceExtent}
          totalListings={totalListings}
        />
      </div>

      <BoroughTable boroughs={BOROUGHS} view={view} focus={focusBorough} onFocus={setFocusBorough} />

      <p className="text-small text-text-secondary">
        The map colours medians, not means. Half these cells hold 23 listings or fewer, and one eight-figure
        listing landing in a cell that size moves its mean by around $930,000, more than the colour ramp&apos;s
        whole span. Means hold up at borough scale, where the smallest pool is 3,575 listings, so that is where
        this table carries one.
      </p>
    </div>
  )
}

function Readout({
  activeCell,
  focusedStat,
  priceExtent,
  totalListings,
}: {
  activeCell: PriceCell | undefined
  focusedStat: BoroughStat | undefined
  priceExtent: readonly [number, number]
  totalListings: number
}) {
  if (activeCell) {
    const sqftText = activeCell.sqft === null ? 'no $/sqft' : `$${activeCell.sqft}/sqft`
    return (
      <p className="text-small text-text-primary" aria-live="polite">
        {formatCount(activeCell.n)} listings &middot; median {formatUSD(activeCell.med)} &middot; {sqftText}{' '}
        &middot; {BOROUGH_NAMES[activeCell.b]}
      </p>
    )
  }
  if (focusedStat) {
    return (
      <p className="text-small text-text-primary" aria-live="polite">
        {focusedStat.name}: {formatCount(focusedStat.n)} listings &middot; median{' '}
        {formatUSD(focusedStat.median)} &middot; P25 {formatUSD(focusedStat.p25)} to P75{' '}
        {formatUSD(focusedStat.p75)} &middot; {`$${focusedStat.medianPerSqft}`}/sqft
      </p>
    )
  }
  return (
    <p className="text-small text-text-secondary" aria-live="polite">
      All five boroughs &middot; {formatCount(totalListings)} listings &middot; median list price{' '}
      {formatUSD(priceExtent[0])} to {formatUSD(priceExtent[1])} across the city.
    </p>
  )
}

function hasWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function ViewControl({ value, onChange }: { value: SurfaceView; onChange: (v: SurfaceView) => void }) {
  const { groupProps, getRadioProps } = useRovingRadioGroup(VIEW_VALUES, value, onChange)

  return (
    <div role="radiogroup" aria-label="Map view" className="flex gap-1" {...groupProps}>
      {VIEW_OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            {...getRadioProps(option.value)}
            className={clsx(
              'whitespace-nowrap rounded-sm border px-2 py-1 text-small transition-colors duration-(--dur-fast)',
              selected
                ? 'border-text-primary bg-text-primary text-surface-0'
                : 'border-border-strong bg-surface-1 text-text-secondary hover:bg-surface-2',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
