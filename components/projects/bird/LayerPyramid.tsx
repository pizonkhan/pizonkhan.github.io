'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import { VGG16_BLOCKS, VGG16_HEAD } from '@/content/data/bird-vgg16-layers'
import { ActivationStrip } from './ActivationStrip'

const MAX_SPATIAL = VGG16_BLOCKS[0].spatialIn

const tableRows = [
  ...VGG16_BLOCKS.map((block) => ({
    layer: `Block ${block.block}`,
    detail: block.layers,
    spatial: `${block.spatialIn} to ${block.spatialOut}`,
    channels: String(block.channels),
    params: block.params.toLocaleString('en-US'),
    state: block.frozen ? 'frozen' : 'fine-tuned',
  })),
  ...VGG16_HEAD.map((layer) => ({
    layer: layer.name,
    detail: layer.note ?? '',
    spatial: '',
    channels: String(layer.units),
    params: layer.params.toLocaleString('en-US'),
    state: '',
  })),
]

const BLOCK_VALUES = VGG16_BLOCKS.map((block) => String(block.block))

/**
 * The theory beat: space shrinks, meaning accumulates. Five real VGG16 blocks collapse inward
 * in sequence, and alongside them ActivationStrip shows six real channel thumbnails for
 * whichever block is selected, from a stock ImageNet VGG16 forward pass on the source photo.
 */
export function LayerPyramid() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered
  const [selected, setSelected] = useState(1)
  const { groupProps, getRadioProps } = useRovingRadioGroup(BLOCK_VALUES, String(selected), (next) =>
    setSelected(Number(next)),
  )

  return (
    <Figure
      eyebrow="VGG16 DEPTH"
      title="Space shrinks, meaning accumulates"
      caption="Five real blocks of the backbone this project fine-tuned. Pick one to see its own channels."
      source="VGG16 architecture from the capstone's printed model summary; activations from a stock ImageNet VGG16 forward pass on the source photo."
      well={{ height: 540, heightSm: 420 }}
      table={
        <FigureTable
          caption="VGG16's five convolutional blocks and the classification head above them."
          columns={[
            { key: 'layer', label: 'Layer' },
            { key: 'detail', label: 'Detail' },
            { key: 'spatial', label: 'Spatial', align: 'right' },
            { key: 'channels', label: 'Channels / units', align: 'right' },
            { key: 'params', label: 'Params', align: 'right' },
            { key: 'state', label: 'State' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-4 sm:flex-row">
        <div
          role="radiogroup"
          aria-label="VGG16 block"
          className="flex flex-1 flex-col justify-center gap-1.5"
          {...groupProps}
        >
          {VGG16_BLOCKS.map((block, index) => {
            const widthPct = 30 + (block.spatialOut / MAX_SPATIAL) * 70
            const isSelected = selected === block.block
            const delay = `${index * 180}ms`

            return (
              <button
                key={block.block}
                type="button"
                {...getRadioProps(String(block.block))}
                className={clsx(
                  'flex items-center justify-between rounded-sm border px-2 py-1.5 text-left text-tick transition-colors duration-(--dur-fast)',
                  isSelected ? 'border-text-primary bg-surface-1' : 'border-border-subtle bg-surface-1 hover:bg-surface-2',
                )}
                style={{
                  width: entered ? `${widthPct}%` : '100%',
                  opacity: entered ? 1 : 0,
                  transition: reduced ? 'none' : `width 480ms var(--ease-out) ${delay}, opacity 240ms var(--ease-out) ${delay}`,
                }}
              >
                <span className="text-text-primary">Block {block.block}</span>
                <span className="text-text-tertiary">
                  {block.spatialOut}&sup2; &times; {block.channels}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex-1">
          <ActivationStrip block={selected} />
        </div>
      </div>
    </Figure>
  )
}
