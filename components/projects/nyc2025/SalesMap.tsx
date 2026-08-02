'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { ScaleLegend } from '@/components/viz/ScaleLegend'
import { usePrefersReducedMotion } from '@/lib/motion'
import { useThemeName } from '@/lib/theme'
import type { ThemeName } from '@/lib/theme'
import { formatCompactUSD, formatCount, formatUSD } from '@/lib/format'
import { SEQ, ACCENT, HAIRLINE } from '@/lib/viz/palette'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import {
  BOROUGHS_2025,
  CLASS_CODES,
  CLASS_GROUPS,
  PRICE_BREAKS,
  SNAPSHOT,
} from '@/content/data/nyc-2025-sales'
import { NEIGHBORHOODS_2025, type NeighborhoodStat } from '@/content/data/nyc-2025-neighborhoods'
import { useSalesPoints, useSaleDetail, type SalesPoints, type PointsState } from './useSalesPoints'
import { SalesDetailPanel } from './SalesDetailPanel'
import { NeighborhoodTable, neighborhoodKey } from './NeighborhoodTable'

export type PropertyGroup = 'all' | 'houses' | 'condos' | 'coops'

export interface SalesMapProps {
  /** Defaults to 'all'. Present so a future route can deep-link a filtered view. */
  initialGroup?: PropertyGroup
}

const STYLE_URL: Record<ThemeName, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

const BOUNDS: [[number, number], [number, number]] = [
  [-74.28, 40.48],
  [-73.68, 40.93],
]
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-74.35, 40.44],
  [-73.6, 40.98],
]

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const GROUP_OPTIONS: readonly { value: PropertyGroup; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'houses', label: 'Houses' },
  { value: 'condos', label: 'Condos' },
  { value: 'coops', label: 'Co-ops' },
]

const GROUP_DESCRIPTION: Record<PropertyGroup, string> = {
  all: 'every property type',
  houses: 'houses only',
  condos: 'condos only',
  coops: 'co-ops only',
}

const FALLBACK_SENTENCE =
  'This map needs WebGL, which this browser has turned off. Every figure it shows is in the '
  + 'neighbourhood table below.'

const POINTS_FAILURE_SENTENCE =
  'The sales file did not load, so the map has no dots. Every figure it shows is in the '
  + 'neighbourhood table below.'

const TABLE_SENTENCE =
  'The neighbourhood table below this map is not filtered: it covers every neighbourhood with '
  + 'at least four sales in the snapshot.'

const CLUSTER_SENTENCE =
  'Dots merge into clusters as you zoom out, and a cluster takes the mean price of the sales '
  + 'inside it.'

const EYEBROW = `${formatCount(SNAPSHOT.points)} RECORDED SALES`
const TITLE = 'Every home New York sold in 2025'
const CAPTION = 'One dot per recorded sale. Zoom in and the clusters split into the sales behind them.'
const SOURCE =
  `New York City Department of Finance, Citywide Annualized Calendar Sales, calendar 2025, `
  + `downloaded ${SNAPSHOT.generatedAt}. Basemap: OpenFreeMap, OpenMapTiles, data from OpenStreetMap.`
const WELL = { height: 560, heightSm: 620 }

const BOROUGH_TABLE_ROWS = BOROUGHS_2025.map((borough) => ({
  borough: borough.name,
  sales: formatCount(borough.n),
  median: formatUSD(borough.median),
  p25: formatUSD(borough.p25),
  p75: formatUSD(borough.p75),
  perSqFt: formatUSD(borough.medianPerSqFt),
  perSqFtRows: formatCount(borough.perSqFtRows),
}))

const EXTREME_NEIGHBORHOODS = (() => {
  let highest = NEIGHBORHOODS_2025[0]
  let lowest = NEIGHBORHOODS_2025[0]
  for (const row of NEIGHBORHOODS_2025) {
    if (row.median > highest.median) highest = row
    if (row.median < lowest.median) lowest = row
  }
  return { highest, lowest }
})()

function hasWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function classInGroup(clsIndex: number, group: PropertyGroup): boolean {
  if (group === 'all') return true
  const code = CLASS_CODES[clsIndex]
  return (CLASS_GROUPS[group] as readonly string[]).includes(code)
}

interface SaleFeatureProperties {
  p: number
  c: number
  b: number
  i: number
}

interface FilteredPoints {
  collection: GeoJSON.FeatureCollection<GeoJSON.Point, SaleFeatureProperties>
  count: number
  minPrice: number
  maxPrice: number
}

const EMPTY_FILTERED: FilteredPoints = {
  collection: { type: 'FeatureCollection', features: [] },
  count: 0,
  minPrice: 0,
  maxPrice: 0,
}

function buildFilteredPoints(points: SalesPoints, group: PropertyGroup, month: number | null): FilteredPoints {
  const features: GeoJSON.Feature<GeoJSON.Point, SaleFeatureProperties>[] = []
  let min = Infinity
  let max = -Infinity

  for (let i = 0; i < points.meta.n; i += 1) {
    if (month !== null && points.month[i] !== month) continue
    if (!classInGroup(points.cls[i], group)) continue
    const price = points.price[i]
    if (price < min) min = price
    if (price > max) max = price
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [points.lon[i], points.lat[i]] },
      properties: { p: price, c: points.cls[i], b: points.borough[i], i },
    })
  }

  if (features.length === 0) return EMPTY_FILTERED
  return { collection: { type: 'FeatureCollection', features }, count: features.length, minPrice: min, maxPrice: max }
}

/** Step ramp shared by the clusters layer (mean price) and the points layer (exact price). */
function priceRamp(field: ExpressionSpecification): ExpressionSpecification {
  return [
    'step',
    field,
    SEQ[0],
    PRICE_BREAKS[0], SEQ[1],
    PRICE_BREAKS[1], SEQ[2],
    PRICE_BREAKS[2], SEQ[3],
    PRICE_BREAKS[3], SEQ[4],
    PRICE_BREAKS[4], SEQ[5],
    PRICE_BREAKS[5], SEQ[6],
  ]
}

const CLUSTER_LABEL: ExpressionSpecification = [
  'step',
  ['get', 'point_count'],
  ['to-string', ['get', 'point_count']],
  1000,
  ['concat', ['to-string', ['round', ['/', ['get', 'point_count'], 1000]]], 'k'],
]

function selectedFilter(globalIndex: number | null): FilterSpecification {
  return ['all', ['!', ['has', 'point_count']], ['==', ['get', 'i'], globalIndex ?? -1]]
}

function BoroughFigureTableContent() {
  return (
    <div className="flex flex-col gap-4">
      <FigureTable
        caption="Median sale price by borough, from the same 44,784 sales the map draws."
        columns={[
          { key: 'borough', label: 'Borough' },
          { key: 'sales', label: 'Sales', align: 'right' },
          { key: 'median', label: 'Median', align: 'right' },
          { key: 'p25', label: 'P25', align: 'right' },
          { key: 'p75', label: 'P75', align: 'right' },
          { key: 'perSqFt', label: 'Median $/sqft', align: 'right' },
          { key: 'perSqFtRows', label: 'Sales behind $/sqft', align: 'right' },
        ]}
        rows={BOROUGH_TABLE_ROWS}
      />
      <p className="text-small text-text-secondary">
        The highest-priced neighbourhood is {EXTREME_NEIGHBORHOODS.highest.name}, with a median of{' '}
        {formatUSD(EXTREME_NEIGHBORHOODS.highest.median)} over {formatCount(EXTREME_NEIGHBORHOODS.highest.n)} sales.
        The lowest is {EXTREME_NEIGHBORHOODS.lowest.name}, {formatUSD(EXTREME_NEIGHBORHOODS.lowest.median)} over{' '}
        {formatCount(EXTREME_NEIGHBORHOODS.lowest.n)} sales.
      </p>
    </div>
  )
}

/** The WebGL-absent state, and the rare state where the Map constructor itself throws. */
function MapUnsupportedFigure() {
  const [focusKey, setFocusKey] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <Figure eyebrow={EYEBROW} title={TITLE} caption={CAPTION} source={SOURCE} well={WELL} table={<BoroughFigureTableContent />}>
        <div className="flex h-full items-center justify-center p-6 text-center">
          <p className="max-w-sm text-body text-text-secondary">{FALLBACK_SENTENCE}</p>
        </div>
      </Figure>
      <NeighborhoodTable
        rows={NEIGHBORHOODS_2025}
        group="all"
        month={null}
        focus={focusKey}
        onFocus={setFocusKey}
        onSelect={() => {}}
      />
    </div>
  )
}

function PropertyGroupControl({ value, onChange }: { value: PropertyGroup; onChange: (next: PropertyGroup) => void }) {
  const { groupProps, getRadioProps } = useRovingRadioGroup(
    GROUP_OPTIONS.map((option) => option.value),
    value,
    onChange,
  )

  return (
    <div role="radiogroup" aria-label="Property type" className="flex gap-1" {...groupProps}>
      {GROUP_OPTIONS.map((option) => {
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

function MonthSelect({ value, onChange }: { value: number | null; onChange: (next: number | null) => void }) {
  return (
    <label className="flex items-center gap-2 text-small text-text-secondary">
      Month
      <select
        value={value === null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        className="rounded-(--radius-sm) border border-border-strong bg-surface-1 px-2 py-1 text-small text-text-primary"
      >
        <option value="">All months</option>
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * The real map, mounted only once WebGL is confirmed present. Owns the MapLibre instance and
 * its whole lifecycle: source, four layers, the focused-neighbourhood marker, both filters, the
 * legend, the selection state, SalesDetailPanel and NeighborhoodTable.
 */
function SalesMapReady({ initialGroup }: { initialGroup: PropertyGroup }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const appliedThemeRef = useRef<ThemeName | null>(null)
  const themeRef = useRef<ThemeName>('light')
  const reducedRef = useRef(false)
  const selectedIndexRef = useRef<number | null>(null)
  const filteredRef = useRef<FilteredPoints>(EMPTY_FILTERED)
  const enteredRef = useRef(false)
  const pointsStatusRef = useRef<PointsState['status']>('loading')

  const [mapCreated, setMapCreated] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [group, setGroup] = useState<PropertyGroup>(initialGroup)
  const [monthFilter, setMonthFilter] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)

  const theme = useThemeName()
  const reduced = usePrefersReducedMotion()
  const pointsState = useSalesPoints(mapCreated)

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  useEffect(() => {
    selectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  useEffect(() => {
    pointsStatusRef.current = pointsState.status
  }, [pointsState.status])

  const filtered = useMemo(() => {
    if (pointsState.status !== 'ready') return EMPTY_FILTERED
    return buildFilteredPoints(pointsState.points, group, monthFilter)
  }, [pointsState, group, monthFilter])

  const updateCanvasA11y = useCallback((map: maplibregl.Map) => {
    const canvas = map.getCanvas()
    const status = pointsStatusRef.current
    const label =
      status === 'ready'
        ? `Map of ${formatCount(filteredRef.current.count)} recorded 2025 home sales across New York City, coloured by sale price.`
        : status === 'error'
          ? 'Map of New York City home sales. The sales file did not load, so the map has no dots.'
          : 'Map of New York City home sales. The sales file is still loading.'
    canvas.setAttribute('aria-label', label)
    canvas.setAttribute('aria-describedby', 'sales-map-summary')
  }, [])

  const addSourceAndLayers = useCallback((map: maplibregl.Map) => {
    const hairline = HAIRLINE[themeRef.current]
    const accent = ACCENT[themeRef.current]
    const initialOpacity = enteredRef.current ? 1 : 0
    const opacityTransition = { duration: reducedRef.current ? 0 : 900, delay: 0 }

    // setStyle's diff does not reliably drop a runtime-added source, and it can drop the layers
    // that sit on it, so this callback has to survive being handed a map that already has some
    // of what it is about to add. Layers first: a source with layers on it cannot be removed.
    for (const id of ['selected', 'points', 'cluster-count', 'clusters']) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    if (map.getSource('sales')) map.removeSource('sales')

    map.addSource('sales', {
      type: 'geojson',
      data: filteredRef.current.collection,
      cluster: true,
      clusterRadius: 60,
      clusterMaxZoom: 14,
      clusterProperties: { priceSum: ['+', ['get', 'p']] },
    })

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'sales',
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 100, 24, 1000, 30],
        'circle-color': priceRamp(['/', ['get', 'priceSum'], ['get', 'point_count']]),
        'circle-stroke-width': 1,
        'circle-stroke-color': hairline,
        'circle-opacity': initialOpacity,
        'circle-opacity-transition': opacityTransition,
        'circle-stroke-opacity': initialOpacity,
      },
    })

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'sales',
      filter: ['has', 'point_count'],
      layout: {
        // OpenFreeMap's positron and dark styles both ship Noto Sans and nothing else. Leaving
        // this unset makes MapLibre ask for the spec default, "Open Sans Regular,Arial Unicode
        // MS Regular", which that host 404s on every load.
        'text-font': ['Noto Sans Regular'],
        'text-field': CLUSTER_LABEL,
        'text-size': 11,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#F6F6F4',
        'text-halo-color': '#0B0C0E',
        'text-halo-width': 1,
      },
    })

    map.addLayer({
      id: 'points',
      type: 'circle',
      source: 'sales',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 3, 16, 6],
        'circle-color': priceRamp(['get', 'p']),
        'circle-stroke-width': 0.5,
        'circle-stroke-color': hairline,
        'circle-opacity': initialOpacity,
        'circle-opacity-transition': opacityTransition,
        'circle-stroke-opacity': initialOpacity,
      },
    })

    map.addLayer({
      id: 'selected',
      type: 'circle',
      source: 'sales',
      filter: selectedFilter(selectedIndexRef.current),
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 7, 16, 10],
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-width': 2,
        'circle-stroke-color': accent,
      },
    })
  }, [])

  const attachHandlers = useCallback((map: maplibregl.Map) => {
    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = ''
    })
    map.on('mouseenter', 'points', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'points', () => {
      map.getCanvas().style.cursor = ''
    })

    map.on('click', 'clusters', (event) => {
      const feature = event.features?.[0]
      if (!feature || feature.geometry.type !== 'Point') return
      const clusterId = Number(feature.properties?.cluster_id)
      if (!Number.isFinite(clusterId)) return
      const source = map.getSource<maplibregl.GeoJSONSource>('sales')
      if (!source) return
      const coordinates = feature.geometry.coordinates as [number, number]
      source
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          map.easeTo({ center: coordinates, zoom, duration: reducedRef.current ? 0 : 500 })
        })
        .catch(() => {})
    })

    map.on('click', 'points', (event) => {
      const feature = event.features?.[0]
      const globalIndex = Number(feature?.properties?.i)
      if (!Number.isFinite(globalIndex)) return
      setSelectedIndex(globalIndex)
    })
  }, [])

  // Mount once: create the map, load its style, then add the source, the four layers and the
  // click/hover handlers. If WebGL passed the probe but the constructor still throws, fall back
  // to the same well the probe-false state renders, per the plan's explicit note.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ThemeScript has already set data-theme on <html> before first paint, so the DOM is the
    // truthful source here. useThemeName() deliberately reports 'light' on the first client
    // render so a static export cannot mismatch on hydration, and constructing from that value
    // is what gave a dark-theme visitor a light map and then a style swap it did not need.
    const domTheme: ThemeName = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    themeRef.current = domTheme
    appliedThemeRef.current = domTheme

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL[domTheme],
        bounds: BOUNDS,
        fitBoundsOptions: { padding: 24 },
        maxBounds: MAX_BOUNDS,
        minZoom: 9,
        maxZoom: 17,
        attributionControl: { compact: false },
        cooperativeGestures: true,
        keyboard: true,
        dragRotate: false,
        touchPitch: false,
      })
    } catch {
      setMapFailed(true)
      return
    }

    mapRef.current = map
    setMapCreated(true)

    map.once('load', () => {
      addSourceAndLayers(map)
      attachHandlers(map)
      updateCanvasA11y(map)
      setMapReady(true)
    })

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [addSourceAndLayers, attachHandlers, updateCanvasA11y])

  // Filter change (or the points arriving for the first time): rebuild the GeoJSON, push it to
  // the source, refresh the canvas's own description, and run the one-shot entry fade the first
  // time real data lands.
  useEffect(() => {
    filteredRef.current = filtered
    const map = mapRef.current
    if (!map || !mapReady) return

    const source = map.getSource<maplibregl.GeoJSONSource>('sales')
    source?.setData(filtered.collection)
    updateCanvasA11y(map)

    if (!enteredRef.current && pointsState.status === 'ready') {
      enteredRef.current = true
      const reveal = () => {
        map.setPaintProperty('clusters', 'circle-opacity', 1)
        map.setPaintProperty('clusters', 'circle-stroke-opacity', 1)
        map.setPaintProperty('points', 'circle-opacity', 1)
        map.setPaintProperty('points', 'circle-stroke-opacity', 1)
      }
      if (reducedRef.current) reveal()
      else requestAnimationFrame(reveal)
    }
  }, [filtered, mapReady, pointsState.status, updateCanvasA11y])

  // Theme change: setStyle wipes every custom source and layer, so re-add them and reapply the
  // canvas's accessible description inside a one-shot styledata handler. The click and hover
  // handlers do not need reattaching: MapLibre's layer-scoped `on()` matches by layer id at
  // dispatch time rather than binding to the layer instance, so a handler registered once at
  // mount starts matching again the moment a layer with that id exists, with no duplicate
  // listeners accumulating across repeated theme toggles.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (appliedThemeRef.current === theme) return
    appliedThemeRef.current = theme

    map.setStyle(STYLE_URL[theme])
    map.once('styledata', () => {
      addSourceAndLayers(map)
      updateCanvasA11y(map)
    })
  }, [theme, mapReady, addSourceAndLayers, updateCanvasA11y])

  // Selection change: the accent ring is a layer filter, not a rebuild.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (map.getLayer('selected')) map.setFilter('selected', selectedFilter(selectedIndex))
  }, [selectedIndex, mapReady])

  // Focused neighbourhood row: one DOM marker, added and removed rather than kept as a layer,
  // per the plan's note on why this mark survives setStyle without JavaScript re-adding it.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const row = focusKey ? NEIGHBORHOODS_2025.find((candidate) => neighborhoodKey(candidate) === focusKey) : undefined

    if (!row) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    if (!markerRef.current) {
      const element = document.createElement('div')
      element.setAttribute('aria-hidden', 'true')
      element.style.width = '24px'
      element.style.height = '24px'
      element.style.borderRadius = '9999px'
      element.style.border = '2px solid var(--accent)'
      element.style.background = 'transparent'
      element.style.pointerEvents = 'none'
      markerRef.current = new maplibregl.Marker({ element })
    }

    markerRef.current.setLngLat([row.lon, row.lat]).addTo(map)
  }, [focusKey, mapReady])

  const selectedSale = useMemo(() => {
    if (selectedIndex === null || pointsState.status !== 'ready') return null
    const points = pointsState.points
    return {
      globalIndex: selectedIndex,
      price: points.price[selectedIndex],
      boroughIndex: points.borough[selectedIndex],
      classCode: CLASS_CODES[points.cls[selectedIndex]],
      month: points.month[selectedIndex],
    }
  }, [selectedIndex, pointsState])

  const detailState = useSaleDetail(selectedSale ? selectedSale.boroughIndex : null, selectedIndex)

  const handleNeighborhoodSelect = useCallback(
    (row: NeighborhoodStat) => {
      if (pointsState.status === 'ready') {
        const points = pointsState.points
        let bestIndex = -1
        let bestDistance = Infinity
        for (let i = 0; i < points.meta.n; i += 1) {
          if (monthFilter !== null && points.month[i] !== monthFilter) continue
          if (!classInGroup(points.cls[i], group)) continue
          const dLat = points.lat[i] - row.lat
          const dLon = points.lon[i] - row.lon
          const distance = dLat * dLat + dLon * dLon
          if (distance < bestDistance) {
            bestDistance = distance
            bestIndex = i
          }
        }
        if (bestIndex !== -1) setSelectedIndex(bestIndex)
      }
      mapRef.current?.flyTo({ center: [row.lon, row.lat], zoom: 14, duration: reducedRef.current ? 0 : 700 })
    },
    [pointsState, monthFilter, group],
  )

  if (mapFailed) return <MapUnsupportedFigure />

  const monthDescription = monthFilter === null ? 'every month' : `${MONTH_NAMES[monthFilter]} only`

  let summaryText: string
  if (pointsState.status === 'error') {
    summaryText = `${POINTS_FAILURE_SENTENCE} ${TABLE_SENTENCE}`
  } else if (pointsState.status === 'loading') {
    summaryText = `Loading the 2025 sales file. ${TABLE_SENTENCE}`
  } else if (filtered.count === 0) {
    summaryText =
      `No sales match this filter: ${GROUP_DESCRIPTION[group]}, ${monthDescription}. `
      + `${TABLE_SENTENCE}`
  } else {
    summaryText =
      `Showing ${formatCount(filtered.count)} sales, ${GROUP_DESCRIPTION[group]}, `
      + `${monthDescription}. Prices run from ${formatUSD(filtered.minPrice)} to `
      + `${formatUSD(filtered.maxPrice)}. ${CLUSTER_SENTENCE} ${TABLE_SENTENCE}`
  }

  return (
    <div className="flex flex-col gap-4">
      <Figure
        eyebrow={EYEBROW}
        title={TITLE}
        caption={CAPTION}
        source={SOURCE}
        well={WELL}
        controls={
          <div className="flex flex-wrap items-center gap-3">
            <PropertyGroupControl value={group} onChange={setGroup} />
            <MonthSelect value={monthFilter} onChange={setMonthFilter} />
          </div>
        }
        table={<BoroughFigureTableContent />}
      >
        <p id="sales-map-summary" className="sr-only">
          {summaryText}
        </p>
        {/*
          Positioned inline, not with `absolute inset-0`. MapLibre stamps its own `maplibregl-map`
          class on this element, maplibre-gl.css sets `.maplibregl-map{position:relative}` at the
          same specificity as Tailwind's `.absolute`, and that stylesheet ships in the lazy chunk,
          so it loads after the main sheet and wins the cascade. An inline style cannot be beaten
          by either.
        */}
        <div
          ref={containerRef}
          style={{ position: 'absolute', inset: 0 }}
          className="overflow-hidden rounded-(--radius-lg)"
        />
        {pointsState.status === 'error' && (
          <p className="absolute inset-x-4 top-4 z-10 rounded-(--radius-sm) border border-border-strong bg-surface-1 px-3 py-2 text-small text-text-secondary">
            {POINTS_FAILURE_SENTENCE}
          </p>
        )}
      </Figure>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ScaleLegend
          colors={SEQ}
          breakLabels={PRICE_BREAKS.map((value) => formatCompactUSD(value))}
          lowLabel="Lower"
          highLabel="Higher"
          className="max-w-sm"
        />
        <p className="max-w-sm text-tick text-text-tertiary">
          Cluster colour is the mean price of the sales inside it. Single dots carry their own price.
        </p>
      </div>

      <SalesDetailPanel sale={selectedSale} detail={detailState} year={SNAPSHOT.year} />

      <NeighborhoodTable
        rows={NEIGHBORHOODS_2025}
        group={group}
        month={monthFilter}
        focus={focusKey}
        onFocus={setFocusKey}
        onSelect={handleNeighborhoodSelect}
      />
    </div>
  )
}

/**
 * The centrepiece: probes for WebGL before ever constructing a maplibregl.Map, so a browser
 * with WebGL turned off never issues a tile request, a points.json fetch or a shard fetch.
 * `maplibregl.supported()` does not exist in MapLibre 5's published typings, so the probe is
 * direct: a canvas context request, wrapped so a throw reads as "unsupported" too.
 */
export function SalesMap({ initialGroup = 'all' }: SalesMapProps) {
  const [webglOk] = useState(() => (typeof document === 'undefined' ? true : hasWebgl()))

  if (!webglOk) return <MapUnsupportedFigure />
  return <SalesMapReady initialGroup={initialGroup} />
}
