'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { ThemeName } from '@/lib/theme'
import { usePrefersReducedMotion } from '@/lib/motion'
import { ACCENT, HAIRLINE, rampIndexFor, SEQ } from '@/lib/viz/palette'
import type { BoroughName, SurfaceView } from './PriceSurface'
import {
  BOROUGH_NAMES,
  COL_RANGE,
  MEDIAN_BREAKS,
  ROW_RANGE,
  SQFT_BREAKS,
  type PriceCell,
} from '@/content/data/nyc-price-surface'

export interface PriceSurfaceCanvasProps {
  cells: readonly PriceCell[]
  view: SurfaceView
  /** Borough to emphasise; all others drop to 20% alpha. */
  focusBorough: BoroughName | null
  /** Fires on pointer move and on pointer leave (with null). */
  onHoverCell: (cell: PriceCell | null) => void
  /** 0..1 draw progress, driven by the parent's reveal animation. */
  progress: number
  /** From useThemeName(). Selects the hairline and glow literals; var() does not resolve in canvas. */
  theme: ThemeName
}

/**
 * text-tertiary's literal values, for the density view's neutral fill. Not part of
 * lib/viz/palette.ts's contract (that module only promises HAIRLINE and ACCENT), so this is
 * kept local to the one component that needs it. Source of truth is app/globals.css's
 * --text-tertiary; keep the two in step.
 */
const TEXT_TERTIARY: Record<ThemeName, [number, number, number]> = {
  light: [0x5f, 0x64, 0x68],
  dark: [0x89, 0x8e, 0x91],
}

const ROWS = ROW_RANGE[1] - ROW_RANGE[0] + 1
const COLS = COL_RANGE[1] - COL_RANGE[0] + 1

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)]
}

const SEQ_RGB = SEQ.map(hexToRgb)

interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(from: RGBA, to: RGBA, t: number): RGBA {
  return { r: lerp(from.r, to.r, t), g: lerp(from.g, to.g, t), b: lerp(from.b, to.b, t), a: lerp(from.a, to.a, t) }
}

function rgbaString({ r, g, b, a }: RGBA): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
}

/** density: 0.25 to 1 alpha over the neutral text-tertiary tone, clamped at n = 40 listings. */
function densityColor(cell: PriceCell, theme: ThemeName): RGBA {
  const [r, g, b] = TEXT_TERTIARY[theme]
  const alpha = 0.25 + 0.75 * Math.min(cell.n / 40, 1)
  return { r, g, b, a: alpha }
}

function colorForView(view: SurfaceView, cell: PriceCell, theme: ThemeName): RGBA | null {
  if (view === 'density') return densityColor(cell, theme)
  if (view === 'median') {
    const index = rampIndexFor(cell.med, MEDIAN_BREAKS)
    const [r, g, b] = SEQ_RGB[index]
    return { r, g, b, a: 1 }
  }
  // perSqft
  if (cell.sqft === null) return null
  const index = rampIndexFor(cell.sqft, SQFT_BREAKS)
  const [r, g, b] = SEQ_RGB[index]
  return { r, g, b, a: 1 }
}

/**
 * Draws the O(1)-hit-tested price surface: a regular lat/lon lattice, so pointer (x, y)
 * inverts directly to (row, col) and looks up a Map<string, PriceCell>. No picking buffer, no
 * quadtree, no per-cell DOM node. role="img": the canvas is a rendering surface, not the
 * keyboard interrogation path (that is BoroughTable).
 */
export function PriceSurfaceCanvas({ cells, view, focusBorough, onHoverCell, progress, theme }: PriceSurfaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  const cellMap = useMemo(() => {
    const map = new Map<string, PriceCell>()
    for (const cell of cells) map.set(`${cell.r}:${cell.c}`, cell)
    return map
  }, [cells])

  const layout = useMemo(() => {
    const centroidR = cells.reduce((sum, cell) => sum + cell.r, 0) / cells.length
    const centroidC = cells.reduce((sum, cell) => sum + cell.c, 0) / cells.length
    let maxDistance = 0
    const distances = new Map<string, number>()
    for (const cell of cells) {
      const distance = Math.hypot(cell.r - centroidR, cell.c - centroidC)
      distances.set(`${cell.r}:${cell.c}`, distance)
      if (distance > maxDistance) maxDistance = distance
    }
    return { distances, maxDistance: maxDistance || 1 }
  }, [cells])

  // Colour interpolation on view change: --dur-base, colour only, geometry never moves.
  const prevViewRef = useRef<SurfaceView>(view)
  const colorAnimRef = useRef({ from: view, t: 1 })
  const focusAnimRef = useRef({ from: focusBorough, t: 1 })
  const prevFocusRef = useRef<BoroughName | null>(focusBorough)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 })

  useEffect(() => {
    if (prevViewRef.current !== view) {
      colorAnimRef.current = { from: prevViewRef.current, t: reduced ? 1 : 0 }
      prevViewRef.current = view
    }
  }, [view, reduced])

  useEffect(() => {
    if (prevFocusRef.current !== focusBorough) {
      focusAnimRef.current = { from: prevFocusRef.current, t: reduced ? 1 : 0 }
      prevFocusRef.current = focusBorough
    }
  }, [focusBorough, reduced])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    function resize() {
      const rect = container!.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      sizeRef.current = { width: rect.width, height: rect.height, dpr }
      canvas!.width = Math.round(rect.width * dpr)
      canvas!.height = Math.round(rect.height * dpr)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    return startAnimation(ctx)

    // `context` is a plain, non-nullable parameter rather than the closure-captured `ctx`:
    // TypeScript does not retain a null-check's narrowing across the closure boundary that
    // requestAnimationFrame's recursive callback creates, so this indirection is what lets
    // every draw call stay typed without a non-null assertion.
    function startAnimation(context: CanvasRenderingContext2D) {
      const durationBase = 240
      const durationFast = 120
      let cancelled = false
      let last = performance.now()

      function draw(now: number) {
        if (cancelled) return
        const dt = now - last
        last = now

        if (colorAnimRef.current.t < 1) {
          colorAnimRef.current = { ...colorAnimRef.current, t: Math.min(colorAnimRef.current.t + dt / durationBase, 1) }
        }
        if (focusAnimRef.current.t < 1) {
          focusAnimRef.current = { ...focusAnimRef.current, t: Math.min(focusAnimRef.current.t + dt / durationFast, 1) }
        }

        const { width, height, dpr } = sizeRef.current
        if (width === 0 || height === 0) {
          rafRef.current = requestAnimationFrame(draw)
          return
        }
        context.save()
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
        context.clearRect(0, 0, width, height)

        const cellSize = Math.min(width / COLS, height / ROWS)
        const gap = 1

        for (const cell of cells) {
          const key = `${cell.r}:${cell.c}`
          const distance = layout.distances.get(key) ?? 0
          // Compressed by (1 - 0.244) so the farthest cell's entry window ends at progress 1
          // instead of starting there: every cell reaches full alpha and full scale inside
          // the reveal's own duration rather than staying permanently mid-fade.
          const threshold = (distance / layout.maxDistance) * (1 - 0.244)
          const entryFraction = reduced ? 1 : Math.max(0, Math.min((progress - threshold) / 0.244, 1))
          if (entryFraction <= 0) continue

          const currentColor = colorForView(view, cell, theme)
          const fromColor = colorForView(colorAnimRef.current.from, cell, theme)
          const color = colorAnimRef.current.t < 1 && fromColor && currentColor
            ? lerpColor(fromColor, currentColor, colorAnimRef.current.t)
            : currentColor

          const x = (cell.c - COL_RANGE[0]) * cellSize
          const y = (ROW_RANGE[1] - cell.r) * cellSize
          const size = Math.max(cellSize - gap, 1)

          const isFocused = focusBorough === null || BOROUGH_NAMES[cell.b] === focusBorough
          const wasFocused = focusAnimRef.current.from === null || BOROUGH_NAMES[cell.b] === focusAnimRef.current.from
          const focusAlphaFrom = wasFocused ? 1 : 0.2
          const focusAlphaTo = isFocused ? 1 : 0.2
          const focusAlpha = focusAnimRef.current.t < 1
            ? lerp(focusAlphaFrom, focusAlphaTo, focusAnimRef.current.t)
            : focusAlphaTo

          const scale = 0.4 + 0.6 * entryFraction
          const drawSize = size * scale
          const offset = (size - drawSize) / 2

          context.globalAlpha = entryFraction * focusAlpha

          if (color) {
            context.fillStyle = rgbaString(color)
            context.fillRect(x + offset, y + offset, drawSize, drawSize)
            context.lineWidth = 0.5
            context.strokeStyle = HAIRLINE[theme]
            context.strokeRect(x + offset, y + offset, drawSize, drawSize)
          } else {
            // perSqft view, no valid $/sqft for this cell: outline only, no fill.
            context.lineWidth = 1
            context.strokeStyle = HAIRLINE[theme]
            context.strokeRect(x + offset, y + offset, drawSize, drawSize)
          }

          if (focusBorough !== null && BOROUGH_NAMES[cell.b] === focusBorough) {
            context.lineWidth = 1
            context.strokeStyle = ACCENT[theme]
            context.strokeRect(x + offset - 0.5, y + offset - 0.5, drawSize + 1, drawSize + 1)
          }
        }

        context.globalAlpha = 1
        context.restore()

        const stillAnimating = colorAnimRef.current.t < 1 || focusAnimRef.current.t < 1 || (!reduced && progress < 1)
        if (stillAnimating) rafRef.current = requestAnimationFrame(draw)
      }

      rafRef.current = requestAnimationFrame(draw)
      return () => {
        cancelled = true
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      }
    }
  }, [cells, view, focusBorough, progress, theme, reduced, layout])

  function cellAt(clientX: number, clientY: number): PriceCell | null {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    const { width, height } = sizeRef.current
    const cellSize = Math.min(width / COLS, height / ROWS)
    const localX = clientX - rect.left
    const localY = clientY - rect.top
    const c = COL_RANGE[0] + Math.floor(localX / cellSize)
    const r = ROW_RANGE[1] - Math.floor(localY / cellSize)
    return cellMap.get(`${r}:${c}`) ?? null
  }

  const ariaLabel = ariaLabelForView(view, cells)

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      role="img"
      aria-label={ariaLabel}
      onPointerMove={(event) => onHoverCell(cellAt(event.clientX, event.clientY))}
      onPointerLeave={() => onHoverCell(null)}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}

function ariaLabelForView(view: SurfaceView, cells: readonly PriceCell[]): string {
  if (view === 'density') {
    return `Map of ${cells.length} aggregated cells across New York City, shaded by listing count per cell.`
  }
  if (view === 'median') {
    const values = cells.map((cell) => cell.med)
    const min = Math.min(...values)
    const max = Math.max(...values)
    return `Map of ${cells.length} aggregated cells across New York City, coloured by median list price `
      + `from $${min.toLocaleString('en-US')} to $${max.toLocaleString('en-US')}. Manhattan is highest.`
  }
  const values = cells.map((cell) => cell.sqft).filter((v): v is number => v !== null)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return `Map of ${cells.length} aggregated cells across New York City, coloured by median price per `
    + `square foot from $${min.toLocaleString('en-US')} to $${max.toLocaleString('en-US')}. Manhattan is highest.`
}
