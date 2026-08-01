'use client'

import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { ScaleLegend } from '@/components/viz/ScaleLegend'
import { DURATION, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { useThemeName } from '@/lib/theme'
import { formatCompactUSD, formatCount, formatUSD } from '@/lib/format'
import { rampIndexFor, SEQ } from '@/lib/viz/palette'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import {
  BOROUGH_NAMES,
  CELLS,
  MEDIAN_BREAKS,
  SQFT_BREAKS,
  type PriceCell,
} from '@/content/data/nyc-price-surface'
import { BOROUGHS, type BoroughStat } from '@/content/data/nyc-boroughs'
import { PriceSurfaceCanvas } from './PriceSurfaceCanvas'
import { BoroughTable } from './BoroughTable'

export type SurfaceView = 'density' | 'median' | 'perSqft'
export type { PriceCell }
export type BoroughName = (typeof BOROUGH_NAMES)[number]

export interface PriceSurfaceProps {
  /** Defaults to 'density' so the map assembles before it means anything. */
  initialView?: SurfaceView
}

const VIEW_OPTIONS: { value: SurfaceView; label: string }[] = [
  { value: 'density', label: 'Density' },
  { value: 'median', label: 'Median price' },
  { value: 'perSqft', label: 'Price per sq ft' },
]

/**
 * The centrepiece: 2,244 aggregated cells assembling into the shape of New York, then
 * recolouring by median list price or price per square foot. Owns the Figure wrapper, the view
 * segmented control, the legend, the persistent readout panel, BoroughTable and the accessible
 * table equivalent. Delegates every draw call to PriceSurfaceCanvas.
 */
export function PriceSurface({ initialView = 'density' }: PriceSurfaceProps) {
  const [view, setView] = useState<SurfaceView>(initialView)
  const [focusBorough, setFocusBorough] = useState<BoroughName | null>(null)
  const [hoveredCell, setHoveredCell] = useState<PriceCell | null>(null)
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const theme = useThemeName()
  const [progress, setProgress] = useState(reduced ? 1 : 0)

  useEffect(() => {
    if (!hasEntered) return
    if (reduced) {
      setProgress(1)
      return
    }
    let frame: number
    const start = performance.now()
    function tick(now: number) {
      const p = Math.min((now - start) / (DURATION.draw * 1000), 1)
      setProgress(p)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [hasEntered, reduced])

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

  const legendBreaks = view === 'perSqft' ? SQFT_BREAKS : MEDIAN_BREAKS
  const legendBreakLabels = legendBreaks.map((value) => (view === 'perSqft' ? `$${value}` : formatCompactUSD(value)))
  const legendHighlightIndex = focusedStat
    ? rampIndexFor(view === 'perSqft' ? focusedStat.medianPerSqft : focusedStat.median, legendBreaks)
    : null

  const tableRows = BOROUGHS.map((borough) => ({
    borough: borough.name,
    listings: formatCount(borough.n),
    median: formatUSD(borough.median),
    p25: formatUSD(borough.p25),
    p75: formatUSD(borough.p75),
    perSqft: `$${borough.medianPerSqft}`,
  }))

  return (
    <div ref={ref} className="flex flex-col gap-4">
      <Figure
        eyebrow="59,350 LISTINGS"
        title="New York, drawn by its own listings"
        caption="Nothing here is a basemap. The shape is where the homes are."
        source="Zillow 2019 NYC extract, 59,350 cleaned listings aggregated into 2,244 cells of at least four listings each."
        well={{ ratio: '4 / 3' }}
        controls={<ViewControl value={view} onChange={setView} />}
        table={
          <div className="flex flex-col gap-4">
            <FigureTable
              caption="Median list price by borough, from the same cells the map draws."
              columns={[
                { key: 'borough', label: 'Borough' },
                { key: 'listings', label: 'Listings', align: 'right' },
                { key: 'median', label: 'Median', align: 'right' },
                { key: 'p25', label: 'P25', align: 'right' },
                { key: 'p75', label: 'P75', align: 'right' },
                { key: 'perSqft', label: 'Median $/sqft', align: 'right' },
              ]}
              rows={tableRows}
            />
            <p className="text-small text-text-secondary">
              The highest-priced cell on the map has a median list price of {formatUSD(extremeCells.highest.med)}, in{' '}
              {BOROUGH_NAMES[extremeCells.highest.b]}. The lowest is {formatUSD(extremeCells.lowest.med)}, in{' '}
              {BOROUGH_NAMES[extremeCells.lowest.b]}.
            </p>
          </div>
        }
      >
        <PriceSurfaceCanvas
          cells={CELLS}
          view={view}
          focusBorough={focusBorough}
          onHoverCell={(cell) => {
            setHoveredCell(cell)
            setFocusBorough(cell ? BOROUGH_NAMES[cell.b] : null)
          }}
          progress={progress}
          theme={theme}
        />
      </Figure>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {view === 'density' ? (
          <p className="text-tick text-text-tertiary">Fewer listings &rarr; more listings</p>
        ) : (
          <ScaleLegend
            colors={SEQ}
            breakLabels={legendBreakLabels}
            lowLabel="Lower"
            highLabel="Higher"
            highlightIndex={legendHighlightIndex}
            className="max-w-sm"
          />
        )}
        <Readout hoveredCell={hoveredCell} focusedStat={focusedStat} priceExtent={priceExtent} totalListings={totalListings} />
      </div>

      <BoroughTable boroughs={BOROUGHS} view={view} focus={focusBorough} onFocus={setFocusBorough} />
    </div>
  )
}

function Readout({
  hoveredCell,
  focusedStat,
  priceExtent,
  totalListings,
}: {
  hoveredCell: PriceCell | null
  focusedStat: BoroughStat | undefined
  priceExtent: readonly [number, number]
  totalListings: number
}) {
  if (hoveredCell) {
    return (
      <p className="text-small text-text-primary" aria-live="polite">
        {formatCount(hoveredCell.n)} listings &middot; median {formatUSD(hoveredCell.med)} &middot;{' '}
        {BOROUGH_NAMES[hoveredCell.b]}
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

const VIEW_VALUES = VIEW_OPTIONS.map((option) => option.value)

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
              'rounded-sm border px-2.5 py-1 text-small transition-colors duration-(--dur-fast)',
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
