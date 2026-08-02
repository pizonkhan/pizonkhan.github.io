'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { usePrefersReducedMotion } from '@/lib/motion'
import { useThemeName } from '@/lib/theme'
import type { ThemeName } from '@/lib/theme'
import { ACCENT, SEQ } from '@/lib/viz/palette'
import { BOROUGH_NAMES } from '@/content/data/nyc-price-surface'
import { breaksFor, CELL_COLLECTION, DATA_BOUNDS, fieldFor, type BoroughName, type SurfaceView } from './price-cells'

export interface PriceCellMapProps {
  /** Which statistic colours the cells. */
  view: SurfaceView
  /** Borough to emphasise. Every other borough's cells drop to the dim opacity. null = no focus. */
  focusBorough: BoroughName | null
  /** Cell key to ring with the cursor mark, or null. The parent decides hover-vs-pinned precedence. */
  activeKey: string | null
  /** Pointer moved onto a cell, or off every cell (null). Not fired by taps. */
  onHoverCell: (key: string | null) => void
  /** Click or tap. `null` means the press landed on the basemap, not on a cell. */
  onSelectCell: (key: string | null) => void
  /** id of the visually hidden paragraph the canvas points at with aria-describedby. */
  summaryId: string
  /** Fires once if `new maplibregl.Map(...)` throws despite the WebGL probe passing. */
  onUnavailable: () => void
}

const STYLE_URL: Record<ThemeName, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-74.35, 40.44],
  [-73.6, 40.98],
]

const FILL_ON = 0.78 // focused borough, or no borough focused
const FILL_OFF = 0.16 // every other borough while one is focused
const EDGE_ON = 0.35
const EDGE_OFF = 0.18
const DIP_SCALE = 0.26 // applied to the fill only, during the 120 ms view-change dip

const EDGE_COLOR: Record<ThemeName, string> = {
  light: '#0B0C0E',
  dark: '#F6F6F4',
}

// The site's own brand pair, hardcoded rather than theme-keyed: one of the two always clears
// 3:1 against whatever the cell underneath is coloured, in either theme.
const CURSOR_CASING_COLOR = '#0B0C0E'
const CURSOR_CORE_COLOR = '#F6F6F4'

const CANVAS_LABEL: Record<SurfaceView, string> = {
  density: 'Map of 2,244 aggregated cells across New York City, shaded by listing count.',
  median: 'Map of 2,244 aggregated cells across New York City, coloured by median list price.',
  perSqft: 'Map of 2,094 aggregated cells across New York City, coloured by median price per square foot.',
}

// Addition order, used by addSourceAndLayers. The removal loop in that function walks this in
// reverse: a source with layers on it cannot be removed, and layers must come off before it.
const LAYER_IDS = ['cells-fill', 'cells-edge', 'cells-borough', 'cells-cursor-casing', 'cells-cursor'] as const

const round2 = (v: number) => Math.round(v * 100) / 100

function opacityFor(
  on: number,
  off: number,
  focusIndex: number | null,
  scale = 1,
): number | ExpressionSpecification {
  const hi = round2(on * scale)
  if (focusIndex === null) return hi
  return ['case', ['==', ['get', 'b'], focusIndex], hi, round2(off * scale)]
}

function fillColorExpression(view: SurfaceView): ExpressionSpecification {
  const field = fieldFor(view)
  const breaks = breaksFor(view)
  const step: ExpressionSpecification = [
    'step',
    ['get', field],
    SEQ[0],
    breaks[0],
    SEQ[1],
    breaks[1],
    SEQ[2],
    breaks[2],
    SEQ[3],
    breaks[3],
    SEQ[4],
    breaks[4],
    SEQ[5],
    breaks[5],
    SEQ[6],
  ]
  // Only perSqft can have a valueless cell: writing `sqft: null` into the GeoJSON instead of
  // omitting the key would make `['has', 'sqft']` ambiguous, which is why price-cells.ts never
  // writes it.
  if (view === 'perSqft') return ['case', ['has', 'sqft'], step, 'rgba(0, 0, 0, 0)']
  return step
}

function cursorFilter(activeKey: string | null): FilterSpecification {
  return ['==', ['get', 'k'], activeKey ?? '']
}

function boroughFilter(focusIndex: number | null): FilterSpecification {
  return ['==', ['get', 'b'], focusIndex ?? -1]
}

/**
 * The style's first symbol layer, recomputed on every call rather than cached across styles so
 * the theme swap resolves it against the new style. `getLayersOrder()` returns ids only, unlike
 * `getStyle()`, which would serialise the whole 2,244-feature source on every call.
 */
function firstSymbolLayerId(map: maplibregl.Map): string | undefined {
  for (const id of map.getLayersOrder()) {
    if (map.getLayer(id)?.type === 'symbol') return id
  }
  return undefined
}

function boroughIndex(name: BoroughName | null): number | null {
  if (name === null) return null
  const index = BOROUGH_NAMES.indexOf(name)
  return index === -1 ? null : index
}

/**
 * The MapLibre instance and its whole lifecycle: one GeoJSON source, five `cells-*` layers, the
 * theme swap, the entry fade, the view-change dip, the pointer handlers and the canvas's two
 * ARIA attributes. Owns no chrome: no `Figure`, no controls, no legend, no tables, no fallback
 * markup, all of which live in the parent that mounts this component only once WebGL is
 * confirmed present.
 */
export function PriceCellMap({
  view,
  focusBorough,
  activeKey,
  onHoverCell,
  onSelectCell,
  summaryId,
  onUnavailable,
}: PriceCellMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const themeRef = useRef<ThemeName>('light')
  const appliedThemeRef = useRef<ThemeName | null>(null)
  const reducedRef = useRef(false)
  const enteredRef = useRef(false)
  const viewRef = useRef<SurfaceView>(view)
  const appliedViewRef = useRef<SurfaceView>(view)
  const focusIndexRef = useRef<number | null>(boroughIndex(focusBorough))
  const activeKeyRef = useRef<string | null>(activeKey)
  const dipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Latest-callback refs, so the mount effect (which must run exactly once) never has to
  // depend on prop identities the parent may not memoise.
  const onHoverCellRef = useRef(onHoverCell)
  const onSelectCellRef = useRef(onSelectCell)
  const onUnavailableRef = useRef(onUnavailable)

  const [mapReady, setMapReady] = useState(false)

  const theme = useThemeName()
  const reduced = usePrefersReducedMotion()
  const focusIndex = boroughIndex(focusBorough)

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    reducedRef.current = reduced
  }, [reduced])

  useEffect(() => {
    viewRef.current = view
  }, [view])

  useEffect(() => {
    focusIndexRef.current = focusIndex
  }, [focusIndex])

  useEffect(() => {
    activeKeyRef.current = activeKey
  }, [activeKey])

  useEffect(() => {
    onHoverCellRef.current = onHoverCell
  }, [onHoverCell])

  useEffect(() => {
    onSelectCellRef.current = onSelectCell
  }, [onSelectCell])

  useEffect(() => {
    onUnavailableRef.current = onUnavailable
  }, [onUnavailable])

  const updateCanvasA11y = useCallback(
    (map: maplibregl.Map) => {
      const canvas = map.getCanvas()
      canvas.setAttribute('aria-label', CANVAS_LABEL[viewRef.current])
      canvas.setAttribute('aria-describedby', summaryId)
    },
    [summaryId],
  )

  const addSourceAndLayers = useCallback((map: maplibregl.Map) => {
    const theme = themeRef.current
    const entered = enteredRef.current || reducedRef.current
    const opacityTransition = { duration: reducedRef.current ? 0 : 900, delay: 0 }
    const initialFillOpacity = entered ? opacityFor(FILL_ON, FILL_OFF, focusIndexRef.current) : 0
    const initialEdgeOpacity = entered ? opacityFor(EDGE_ON, EDGE_OFF, focusIndexRef.current) : 0

    // setStyle does not reliably preserve a runtime-added source or the layers on it, so this
    // callback has to survive being handed a map that already has some of what it is about to
    // add. Layers first, in reverse of their addition order: a source with layers on it cannot
    // be removed.
    for (const id of [...LAYER_IDS].reverse()) {
      if (map.getLayer(id)) map.removeLayer(id)
    }
    if (map.getSource('price-cells')) map.removeSource('price-cells')

    map.addSource('price-cells', {
      type: 'geojson',
      data: CELL_COLLECTION,
    })

    // Inserted below the style's first symbol layer, so street names, park names and place
    // labels draw on top of the colour rather than under it.
    const beforeId = firstSymbolLayerId(map)

    map.addLayer(
      {
        id: 'cells-fill',
        type: 'fill',
        source: 'price-cells',
        paint: {
          'fill-color': fillColorExpression(viewRef.current),
          'fill-opacity': initialFillOpacity,
          'fill-opacity-transition': opacityTransition,
        },
      },
      beforeId,
    )

    map.addLayer(
      {
        id: 'cells-edge',
        type: 'line',
        source: 'price-cells',
        paint: {
          'line-color': EDGE_COLOR[theme],
          'line-opacity': initialEdgeOpacity,
          'line-opacity-transition': opacityTransition,
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 12, 0.9, 15, 1.6],
        },
      },
      beforeId,
    )

    map.addLayer(
      {
        id: 'cells-borough',
        type: 'line',
        source: 'price-cells',
        filter: boroughFilter(focusIndexRef.current),
        paint: {
          'line-color': ACCENT[theme],
          'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 15, 2],
          'line-opacity': 1,
        },
      },
      beforeId,
    )

    map.addLayer({
      id: 'cells-cursor-casing',
      type: 'line',
      source: 'price-cells',
      filter: cursorFilter(activeKeyRef.current),
      paint: {
        'line-color': CURSOR_CASING_COLOR,
        'line-opacity': 0.85,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 3, 15, 5],
      },
    })

    map.addLayer({
      id: 'cells-cursor',
      type: 'line',
      source: 'price-cells',
      filter: cursorFilter(activeKeyRef.current),
      paint: {
        'line-color': CURSOR_CORE_COLOR,
        'line-opacity': 1,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.5, 15, 2.5],
      },
    })
  }, [])

  const ensureCellLayers = useCallback(
    (map: maplibregl.Map) => {
      // A style with no layers is one that has not finished loading. getLayersOrder is safe to
      // call then; addSource and addLayer are not, they throw "Style is not done loading."
      if (map.getLayersOrder().length === 0) return
      if (map.getSource('price-cells') && LAYER_IDS.every((id) => map.getLayer(id))) return
      addSourceAndLayers(map)
      updateCanvasA11y(map)
    },
    [addSourceAndLayers, updateCanvasA11y],
  )

  const attachHandlers = useCallback((map: maplibregl.Map) => {
    map.on('mouseenter', 'cells-fill', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'cells-fill', () => {
      map.getCanvas().style.cursor = ''
      onHoverCellRef.current(null)
    })
    map.on('mousemove', 'cells-fill', (event) => {
      const key = event.features?.[0]?.properties?.k
      onHoverCellRef.current(typeof key === 'string' ? key : null)
    })

    // One click handler, unscoped, rather than a layer-scoped one on `cells-fill` plus an
    // unscoped one on the map: two handlers would make "clicking a cell" and "clicking the
    // basemap" race, since their relative order is registration order, not specificity.
    map.on('click', (event) => {
      const hit = map.queryRenderedFeatures(event.point, { layers: ['cells-fill'] })[0]
      const key = hit?.properties?.k
      onSelectCellRef.current(typeof key === 'string' ? key : null)
    })
  }, [])

  // Mount once: create the map, load its style, then add the source, the five layers, the
  // controls and the pointer handlers. If WebGL passed the probe but the constructor still
  // throws, tell the parent so it can fall back to the same well the probe-false state renders.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ThemeScript has already set data-theme on <html> before first paint, so the DOM is the
    // truthful source here. useThemeName() deliberately reports 'light' on the first client
    // render so a static export cannot mismatch on hydration, and constructing from that value
    // would hand a dark-theme visitor a light map and then a style swap it did not need.
    const domTheme: ThemeName = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    themeRef.current = domTheme
    appliedThemeRef.current = domTheme

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL[domTheme],
        bounds: DATA_BOUNDS,
        fitBoundsOptions: { padding: 16 },
        maxBounds: MAX_BOUNDS,
        minZoom: 9,
        maxZoom: 15,
        attributionControl: { compact: false },
        cooperativeGestures: true,
        keyboard: true,
        dragRotate: false,
        touchPitch: false,
      })
    } catch {
      onUnavailableRef.current()
      return
    }

    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right')

    map.once('load', () => {
      addSourceAndLayers(map)
      attachHandlers(map)
      updateCanvasA11y(map)
      map.on('styledata', () => ensureCellLayers(map))
      setMapReady(true)

      if (reducedRef.current) {
        enteredRef.current = true
        return
      }

      requestAnimationFrame(() => {
        enteredRef.current = true
        if (map.getLayer('cells-fill')) {
          map.setPaintProperty('cells-fill', 'fill-opacity', opacityFor(FILL_ON, FILL_OFF, focusIndexRef.current))
        }
        if (map.getLayer('cells-edge')) {
          map.setPaintProperty('cells-edge', 'line-opacity', opacityFor(EDGE_ON, EDGE_OFF, focusIndexRef.current))
        }
      })
    })

    return () => {
      if (dipTimeoutRef.current !== null) {
        clearTimeout(dipTimeoutRef.current)
        dipTimeoutRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [addSourceAndLayers, attachHandlers, updateCanvasA11y, ensureCellLayers])

  // Theme change: hand MapLibre the new style URL and let the styledata listener registered at
  // load repair the layers. Not a one-shot handler armed here: setStyle fetches and diffs the new
  // style asynchronously, so the old style stays live for the whole fetch, and styledata fires on
  // any style mutation in the meantime, including the paint writes a borough focus makes. A
  // one-shot would spend itself on one of those and never see the real swap. The pointer handlers
  // do not need reattaching: MapLibre's layer-scoped on() matches by layer id at dispatch time
  // rather than binding to the layer instance, so a handler registered once at mount starts
  // matching again the moment a layer with that id exists.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (appliedThemeRef.current === theme) return
    appliedThemeRef.current = theme
    map.setStyle(STYLE_URL[theme])
  }, [theme, mapReady])

  // Borough focus: an opacity expression and a filter, not a rebuild. MapLibre cannot
  // interpolate a data-driven paint value, so both the constant-to-expression and
  // expression-to-expression writes here snap in a single frame with no timer.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (map.getLayer('cells-fill')) {
      map.setPaintProperty('cells-fill', 'fill-opacity', opacityFor(FILL_ON, FILL_OFF, focusIndex))
    }
    if (map.getLayer('cells-edge')) {
      map.setPaintProperty('cells-edge', 'line-opacity', opacityFor(EDGE_ON, EDGE_OFF, focusIndex))
    }
    if (map.getLayer('cells-borough')) {
      map.setFilter('cells-borough', boroughFilter(focusIndex))
    }
  }, [focusIndex, mapReady])

  // Cursor ring: a filter on the two cursor layers, updated on every hover or tap.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const filter = cursorFilter(activeKey)
    if (map.getLayer('cells-cursor-casing')) map.setFilter('cells-cursor-casing', filter)
    if (map.getLayer('cells-cursor')) map.setFilter('cells-cursor', filter)
  }, [activeKey, mapReady])

  // View change: a 120 ms opacity dip carrying the current focus expression, an instant colour
  // swap in the middle, then the opacity settles and the transition duration is restored to the
  // entry fade's 900 ms. With reduced motion the colour and opacity swap in the same frame, with
  // no transition written and no timer scheduled.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (appliedViewRef.current === view) return
    appliedViewRef.current = view
    // Covers every write below down to the dip: all four target cells-fill, and a style swap
    // that has torn the layer down leaves nothing here for them to touch until the repair
    // listener re-adds it from viewRef on its own pass.
    if (!map.getLayer('cells-fill')) return

    if (reducedRef.current) {
      map.setPaintProperty('cells-fill', 'fill-color', fillColorExpression(view))
      map.setPaintProperty('cells-fill', 'fill-opacity', opacityFor(FILL_ON, FILL_OFF, focusIndexRef.current))
      return
    }

    if (dipTimeoutRef.current !== null) clearTimeout(dipTimeoutRef.current)

    map.setPaintProperty('cells-fill', 'fill-opacity-transition', { duration: 120, delay: 0 })
    map.setPaintProperty(
      'cells-fill',
      'fill-opacity',
      opacityFor(FILL_ON, FILL_OFF, focusIndexRef.current, DIP_SCALE),
    )

    dipTimeoutRef.current = setTimeout(() => {
      dipTimeoutRef.current = null
      // The 120 ms delay can outlive a style swap that started mid-dip, so cells-fill may be
      // gone by the time this runs even though it was present when the dip started.
      if (!map.getLayer('cells-fill')) return
      map.setPaintProperty('cells-fill', 'fill-color', fillColorExpression(view))
      map.setPaintProperty('cells-fill', 'fill-opacity', opacityFor(FILL_ON, FILL_OFF, focusIndexRef.current))
      map.setPaintProperty('cells-fill', 'fill-opacity-transition', { duration: 900, delay: 0 })
    }, 120)
  }, [view, mapReady])

  // The canvas's accessible name names the active view, so it is rewritten on every view change,
  // not only when the map or the style loads.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    updateCanvasA11y(map)
  }, [view, mapReady, updateCanvasA11y])

  return (
    // Positioned inline, never with `className="absolute inset-0"`. MapLibre stamps its own
    // `maplibregl-map` class on this element, `maplibre-gl.css` sets
    // `.maplibregl-map { position: relative }` at the same specificity as Tailwind's `.absolute`,
    // and that stylesheet ships in the lazy chunk, so it loads after the main sheet and wins the
    // cascade. An inline style cannot be beaten by either.
    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} className="overflow-hidden rounded-(--radius-lg)" />
  )
}
