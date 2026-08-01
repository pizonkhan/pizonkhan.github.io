'use client'

import { useEffect, useState } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { withBasePath } from '@/lib/base-path'
import { useBirdAsset } from './useBirdAsset'

type Luminance = readonly number[]

const GRID_SIZE = 28
const CROSSFADE_MS = 600

/**
 * Twelve cells, spread evenly across the 28x28 grid, whose real integer luminance values are
 * printed in the well. Fixed here rather than chosen at runtime, so the figure is deterministic
 * for every visitor and every screenshot.
 */
const REVEALED: readonly { row: number; col: number }[] = [
  { row: 3, col: 4 }, { row: 3, col: 13 }, { row: 3, col: 22 },
  { row: 9, col: 4 }, { row: 9, col: 13 }, { row: 9, col: 22 },
  { row: 15, col: 4 }, { row: 15, col: 13 }, { row: 15, col: 22 },
  { row: 21, col: 4 }, { row: 21, col: 13 }, { row: 21, col: 22 },
]

function cellLabel(row: number, col: number): string {
  return `row ${row + 1}, col ${col + 1}`
}

/**
 * The theory beat: an image is a matrix of numbers. The real 448px source photo cross-fades
 * into the real 28x28 greyscale downsample that drives the convolution figure below it, then
 * twelve cells print their real integer luminance values.
 */
export function PixelMatrix() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered
  const asset = useBirdAsset<Luminance>('luminance-28.json')

  const [showGrid, setShowGrid] = useState(reduced)
  const [revealed, setRevealed] = useState(reduced)

  useEffect(() => {
    if (reduced || !entered || asset.status !== 'ready') return
    const toGrid = window.setTimeout(() => setShowGrid(true), 60)
    const toRevealed = window.setTimeout(() => setRevealed(true), 60 + CROSSFADE_MS)
    return () => {
      window.clearTimeout(toGrid)
      window.clearTimeout(toRevealed)
    }
  }, [entered, reduced, asset.status])

  const stats =
    asset.status === 'ready'
      ? {
          min: Math.min(...asset.data),
          max: Math.max(...asset.data),
          mean: Math.round(asset.data.reduce((sum, v) => sum + v, 0) / asset.data.length),
        }
      : null

  const tableRows = REVEALED.map(({ row, col }) => ({
    cell: cellLabel(row, col),
    value: asset.status === 'ready' ? String(asset.data[row * GRID_SIZE + col]) : 'loading',
  }))

  return (
    <Figure
      eyebrow="PIXELS"
      title="An image is a matrix of numbers"
      caption="Twelve real luminance values, pulled from the same 28x28 downsample the kernel below reads."
      source="Cropped from a public-domain U.S. Fish and Wildlife Service photo of an American robin, downsampled to 28x28 greyscale luminance."
      well={{ ratio: '1 / 1' }}
      table={
        <div className="flex flex-col gap-4">
          <FigureTable
            caption="Integer luminance, 0 to 255, at twelve grid positions."
            columns={[
              { key: 'cell', label: 'Cell' },
              { key: 'value', label: 'Luminance', align: 'right' },
            ]}
            rows={tableRows}
          />
          {stats && (
            <p className="text-small text-text-secondary">
              Across all 784 cells, luminance ranges from {stats.min} to {stats.max} with a mean of {stats.mean}.
            </p>
          )}
        </div>
      }
    >
      <div ref={ref} className="relative h-full w-full">
        {asset.status === 'loading' && (
          <p className="absolute inset-0 flex items-center justify-center text-tick text-text-tertiary">
            Loading the source image.
          </p>
        )}
        {asset.status === 'error' && (
          <p className="absolute inset-0 flex items-center justify-center text-tick text-text-tertiary">
            Could not load the source image.
          </p>
        )}
        {asset.status === 'ready' && (
          <>
            {!reduced && (
              <img
                src={withBasePath('/projects/bird-species-cnn/bird-source.webp')}
                width={448}
                height={448}
                alt="Photograph of an American robin, the source image for this demonstration."
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: showGrid ? 0 : 1,
                  transition: `opacity ${CROSSFADE_MS}ms var(--ease-in-out)`,
                }}
              />
            )}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                opacity: reduced || showGrid ? 1 : 0,
                transition: reduced ? 'none' : `opacity ${CROSSFADE_MS}ms var(--ease-in-out)`,
              }}
            >
              {asset.data.map((value, index) => {
                const row = Math.floor(index / GRID_SIZE)
                const col = index % GRID_SIZE
                const revealedIndex = REVEALED.findIndex((cell) => cell.row === row && cell.col === col)

                return (
                  <div key={index} className="relative" style={{ backgroundColor: `rgb(${value}, ${value}, ${value})` }}>
                    {revealedIndex !== -1 && (
                      <span
                        className="absolute inset-0 flex items-center justify-center text-center text-[8px] leading-none font-mono text-text-primary"
                        style={{
                          backgroundColor: 'var(--surface-1)',
                          opacity: reduced || revealed ? 0.92 : 0,
                          transition: reduced ? 'none' : `opacity 480ms var(--ease-out) ${Math.min(revealedIndex, 7) * 40}ms`,
                        }}
                      >
                        {value}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </Figure>
  )
}
