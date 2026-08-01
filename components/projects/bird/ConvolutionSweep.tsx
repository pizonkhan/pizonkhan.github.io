'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { KernelSweep, KERNELS, type Kernel3 } from '@/components/viz/KernelSweep'
import { usePrefersReducedMotion } from '@/lib/motion'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import { useBirdAsset } from './useBirdAsset'

type Luminance = readonly number[]
type KernelName = keyof typeof KERNELS

const SIZE = 28

const KERNEL_OPTIONS: { value: KernelName; label: string }[] = [
  { value: 'sobelX', label: 'Sobel X' },
  { value: 'sobelY', label: 'Sobel Y' },
  { value: 'laplacian', label: 'Laplacian' },
  { value: 'blur', label: 'Blur' },
  { value: 'identity', label: 'Identity' },
]

/**
 * The theory beat: a filter is nine numbers, and edges fall out of it. Wraps the shared
 * KernelSweep primitive (components/viz/KernelSweep.tsx) at 28x28 with the real luminance
 * downsample from PixelMatrix; owns the Figure chrome, the kernel picker and the live readout,
 * not the convolution arithmetic itself.
 */
export function ConvolutionSweep() {
  const asset = useBirdAsset<Luminance>('luminance-28.json')
  const reduced = usePrefersReducedMotion()
  const [kernelName, setKernelName] = useState<KernelName>('sobelX')
  const [cursor, setCursor] = useState<{ row: number; col: number } | null>(null)

  const kernel: Kernel3 = KERNELS[kernelName]
  // Before any interaction, KernelSweep's own uncontrolled sweep parks at (SIZE - 3, SIZE - 3)
  // for a default-motion visitor. The readout has to describe that same window, not row 1,
  // col 1, or it contradicts the window the accent cursor is actually drawn around.
  const activeCursor = cursor ?? (reduced ? { row: 1, col: 1 } : { row: SIZE - 3, col: SIZE - 3 })
  // Controlled once the reader interacts, or always under reduced motion; undefined otherwise
  // so KernelSweep runs its own uncontrolled, one-shot sweep.
  const sweepCursor = reduced ? activeCursor : (cursor ?? undefined)

  const readout = useMemo(() => {
    if (asset.status !== 'ready') return null
    const values = asset.data
    const cells: { position: string; input: number; weight: number; product: number }[] = []
    const labels = ['top-left', 'top', 'top-right', 'left', 'centre', 'right', 'bottom-left', 'bottom', 'bottom-right']
    let sum = 0
    let k = 0
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        const input = values[(activeCursor.row + i) * SIZE + (activeCursor.col + j)]
        const weight = kernel[k]
        const product = input * weight
        sum += product
        cells.push({ position: labels[k], input, weight, product })
        k += 1
      }
    }
    return { cells, sum }
  }, [asset, activeCursor.row, activeCursor.col, kernel])

  const tableRows =
    readout?.cells.map((cell) => ({
      position: cell.position,
      input: String(cell.input),
      weight: cell.weight.toFixed(3),
      product: cell.product.toFixed(1),
    })) ?? []

  return (
    <div className="flex flex-col gap-4">
      <Figure
        eyebrow="CONVOLUTION"
        title="A filter is nine numbers"
        caption="Real arithmetic over the same 28x28 patch above, not an illustration of it."
        source="Same 28x28 luminance grid as the pixel matrix figure; convolution computed in the browser."
        well={{ ratio: '2 / 1' }}
        controls={<KernelControl value={kernelName} onChange={setKernelName} />}
        table={
          readout ? (
            <div className="flex flex-col gap-4">
              <FigureTable
                caption="The nine input values, the kernel weight at that position, and their product, for the window at the current cursor."
                columns={[
                  { key: 'position', label: 'Position' },
                  { key: 'input', label: 'Input', align: 'right' },
                  { key: 'weight', label: 'Weight', align: 'right' },
                  { key: 'product', label: 'Product', align: 'right' },
                ]}
                rows={tableRows}
              />
              <p className="text-small text-text-secondary">
                Summed, the nine products give {readout.sum.toFixed(1)}, one value in the output grid.
              </p>
            </div>
          ) : (
            <p className="text-small text-text-secondary">Loading the underlying figures.</p>
          )
        }
      >
        {asset.status === 'loading' && (
          <p className="flex h-full items-center justify-center text-tick text-text-tertiary">
            Loading the source grid.
          </p>
        )}
        {asset.status === 'error' && (
          <p className="flex h-full items-center justify-center text-tick text-text-tertiary">
            Could not load the source grid.
          </p>
        )}
        {asset.status === 'ready' && (
          <KernelSweep
            size={SIZE}
            input={asset.data}
            kernel={kernel}
            cursor={sweepCursor}
            onCursorChange={setCursor}
            className="h-full flex-row!"
          />
        )}
      </Figure>

      {/*
        Always mounted, readout or not, so its line box is reserved from first paint: the
        JSON fetch resolving no longer appends unreserved height below an already-swapped
        figure.
      */}
      <p className="text-small text-text-primary" aria-live="polite">
        {readout ? (
          <>
            Window at row {activeCursor.row + 1}, col {activeCursor.col + 1}: nine inputs times the{' '}
            {KERNEL_OPTIONS.find((option) => option.value === kernelName)?.label} weights sum to{' '}
            {readout.sum.toFixed(1)}. Use arrow keys on the grid to move the window.
          </>
        ) : (
          <>&nbsp;</>
        )}
      </p>
    </div>
  )
}

const KERNEL_VALUES = KERNEL_OPTIONS.map((option) => option.value)

function KernelControl({ value, onChange }: { value: KernelName; onChange: (v: KernelName) => void }) {
  const { groupProps, getRadioProps } = useRovingRadioGroup(KERNEL_VALUES, value, onChange)

  return (
    <div role="radiogroup" aria-label="Kernel" className="flex flex-wrap gap-1" {...groupProps}>
      {KERNEL_OPTIONS.map((option) => {
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
