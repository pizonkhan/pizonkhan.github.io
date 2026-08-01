'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { DURATION, usePrefersReducedMotion } from '@/lib/motion'
import { HAIRLINE_CSS, SEQ } from '@/lib/viz/palette'
import { extent, linearScale } from '@/lib/viz/scale'

export type Kernel3 = readonly [
  number, number, number,
  number, number, number,
  number, number, number,
]

/** Named 3x3 kernels shared by every consumer, so a second convolution component is never written. */
export const KERNELS: Record<'identity' | 'sobelX' | 'sobelY' | 'laplacian' | 'blur', Kernel3> = {
  identity: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  sobelX: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  sobelY: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
  laplacian: [0, 1, 0, 1, -4, 1, 0, 1, 0],
  blur: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
}

export interface KernelSweepProps {
  /** Grid edge length. 16 for the hero, 28 for the bird page. */
  size: number
  /** Row-major input values, 0..255, length size*size. Omit for the hero's built-in pattern. */
  input?: readonly number[]
  /** The 3x3 kernel. Default: SOBEL_X. */
  kernel?: Kernel3
  /** ms per row of the sweep. Default 90. */
  rowDurationMs?: number
  /** Decorative mode: aria-hidden, no controls, one pass, then park. */
  decorative?: boolean
  /** Controlled cursor position for reduced-motion / keyboard stepping. */
  cursor?: { row: number; col: number } | null
  onCursorChange?: (cursor: { row: number; col: number }) => void
  className?: string
}

/**
 * A deterministic wave, not a photograph and not random data: the hero's built-in pattern when
 * no real input is supplied.
 */
function syntheticInput(size: number): number[] {
  const values: number[] = []
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const wave = Math.sin(row / 2.1) * Math.cos(col / 2.6) + Math.sin((row + col) / 4)
      values.push(Math.round(128 + wave * 70))
    }
  }
  return values
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * The shared convolution primitive. Used decoratively in the hero at 16x16 with a synthetic
 * pattern, and with real image luminance at 28x28 on the bird page. Renders an input grid with
 * a 3x3 accent-outlined window and an output grid, size-2 per edge, that fills in as the
 * window sweeps. All arithmetic runs in a useMemo over the whole input; no model, no network.
 */
export function KernelSweep({
  size,
  input,
  kernel = KERNELS.sobelX,
  rowDurationMs = 90,
  decorative = false,
  cursor,
  onCursorChange,
  className,
}: KernelSweepProps) {
  const reduced = usePrefersReducedMotion()
  const outSize = Math.max(size - 2, 1)
  const controlled = cursor !== undefined

  const values = useMemo(() => (input ? input.slice() : syntheticInput(size)), [input, size])

  const output = useMemo(() => {
    const result: number[] = []
    for (let row = 0; row < outSize; row += 1) {
      for (let col = 0; col < outSize; col += 1) {
        let sum = 0
        for (let i = 0; i < 3; i += 1) {
          for (let j = 0; j < 3; j += 1) {
            sum += kernel[i * 3 + j] * values[(row + i) * size + (col + j)]
          }
        }
        result.push(sum)
      }
    }
    return result
  }, [values, kernel, size, outSize])

  const toIndex = useMemo(() => {
    const [min, max] = extent(output)
    const scale = linearScale([min, max], [0, 6])
    return (value: number) => Math.round(clamp(scale(value), 0, 6))
  }, [output])

  const [autoCursor, setAutoCursor] = useState({ row: 0, col: 0 })
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const timers = useRef<number[]>([])

  const runningSweep = !controlled && !reduced

  useEffect(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []

    if (reduced || controlled) {
      // Reduced motion (either mode) and controlled/interactive mode both show the full result.
      setRevealed(new Set(Array.from({ length: outSize * outSize }, (_, i) => i)))
      setAutoCursor({ row: outSize - 1, col: outSize - 1 })
      return
    }

    // One-shot sweep, row-major, then park with the output map complete.
    setRevealed(new Set())
    const perCell = rowDurationMs / Math.max(outSize, 1)
    for (let i = 0; i < outSize * outSize; i += 1) {
      const row = Math.floor(i / outSize)
      const col = i % outSize
      const id = window.setTimeout(() => {
        setAutoCursor({ row, col })
        setRevealed((prev) => {
          const next = new Set(prev)
          next.add(i)
          return next
        })
      }, 400 + i * perCell)
      timers.current.push(id)
    }

    return () => {
      timers.current.forEach((id) => window.clearTimeout(id))
    }
  }, [reduced, controlled, outSize, rowDurationMs])

  const activeCursor = cursor ?? autoCursor

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (decorative || !onCursorChange) return
    const current = cursor ?? autoCursor
    let next = current
    if (event.key === 'ArrowRight') next = { ...current, col: clamp(current.col + 1, 0, outSize - 1) }
    else if (event.key === 'ArrowLeft') next = { ...current, col: clamp(current.col - 1, 0, outSize - 1) }
    else if (event.key === 'ArrowDown') next = { ...current, row: clamp(current.row + 1, 0, outSize - 1) }
    else if (event.key === 'ArrowUp') next = { ...current, row: clamp(current.row - 1, 0, outSize - 1) }
    else return
    event.preventDefault()
    onCursorChange(next)
  }

  const cellPercent = 100 / size
  const windowStyle = {
    left: `${activeCursor.col * cellPercent}%`,
    top: `${activeCursor.row * cellPercent}%`,
    width: `${cellPercent * 3}%`,
    height: `${cellPercent * 3}%`,
  }

  return (
    <div
      className={clsx('flex flex-col gap-3 sm:flex-row sm:items-start', className)}
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'group'}
      aria-label={decorative ? undefined : 'Convolution window, use arrow keys to move'}
      tabIndex={decorative ? undefined : 0}
      onKeyDown={handleKeyDown}
    >
      <div className="relative aspect-square flex-1">
        <div
          className="grid h-full w-full overflow-hidden rounded-sm"
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        >
          {values.map((value, i) => (
            <div
              key={i}
              style={{
                backgroundColor: `rgb(${value}, ${value}, ${value})`,
                boxShadow: `inset 0 0 0 0.5px ${HAIRLINE_CSS}`,
              }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute rounded-[1px] outline outline-2 outline-accent"
          style={{ ...windowStyle, transition: runningSweep ? `left ${rowDurationMs}ms linear, top ${rowDurationMs}ms linear` : undefined }}
        />
      </div>
      <div className="aspect-square flex-1">
        <div
          className="grid h-full w-full overflow-hidden rounded-sm"
          style={{ gridTemplateColumns: `repeat(${outSize}, 1fr)` }}
        >
          {output.map((value, i) => (
            <div
              key={i}
              style={{
                backgroundColor: SEQ[toIndex(value)],
                boxShadow: `inset 0 0 0 0.5px ${HAIRLINE_CSS}`,
                opacity: revealed.has(i) ? 1 : 0,
                transition: `opacity ${DURATION.fast * 1000}ms ${'linear'}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
