'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { VGG16_BLOCKS, VGG16_HEAD } from '@/content/data/bird-vgg16-layers'

const ORIGINAL_HEAD = VGG16_HEAD.find((layer) => layer.name.includes('removed'))
const NEW_HEAD = VGG16_HEAD.find((layer) => layer.name.includes('315-way'))

const tableRows = [
  ...VGG16_BLOCKS.map((block) => ({
    layer: `Block ${block.block}`,
    detail: block.layers,
    params: block.params.toLocaleString('en-US'),
    state: block.frozen ? 'frozen' : 'fine-tuned',
  })),
  {
    layer: 'ImageNet head (removed)',
    detail: `${ORIGINAL_HEAD?.units ?? 1000}-way softmax`,
    params: (ORIGINAL_HEAD?.params ?? 0).toLocaleString('en-US'),
    state: 'discarded',
  },
  {
    layer: '315-way head (this project)',
    detail: `${NEW_HEAD?.units ?? 315}-way softmax`,
    params: (NEW_HEAD?.params ?? 0).toLocaleString('en-US'),
    state: 'trained from scratch',
  },
]

/**
 * The theory beat: what was frozen, what was retrained, what that bought. A vertical stack of
 * VGG16's five blocks, hatched where they stayed exactly as ImageNet trained them, solid where
 * they were fine-tuned on bird photos, with the head swap drawn beneath.
 */
export function TransferDiagram() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  return (
    <Figure
      eyebrow="TRANSFER LEARNING"
      title="Five blocks, two states, one new head"
      caption="Everything above this point is stock ImageNet VGG16, the backbone I froze. I replaced the 1,000-way head with a 315-way one, froze blocks 1 to 3, and fine-tuned from block4_conv1."
      source="VGG16 architecture and parameter counts from the capstone's written report. Blocks 1 to 3 are the literal frozen layers of the fine-tuned model."
      well={{ height: 340, heightSm: 300 }}
      table={
        <FigureTable
          caption="Every VGG16 block plus the classification head, its state and its parameter count."
          columns={[
            { key: 'layer', label: 'Layer' },
            { key: 'detail', label: 'Detail' },
            { key: 'params', label: 'Params', align: 'right' },
            { key: 'state', label: 'State' },
          ]}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-1.5 py-1">
        {VGG16_BLOCKS.map((block, index) => {
          const delay = `${index * 120}ms`
          return (
            <div
              key={block.block}
              className="flex items-center justify-between rounded-sm border px-3 py-2 text-tick"
              style={{
                borderColor: block.frozen ? 'var(--border-subtle)' : 'var(--text-primary)',
                backgroundColor: block.frozen ? 'transparent' : 'var(--surface-1)',
                backgroundImage: block.frozen
                  ? 'repeating-linear-gradient(45deg, var(--viz-hairline) 0, var(--viz-hairline) 1px, transparent 1px, transparent 6px)'
                  : 'none',
                opacity: entered ? 1 : 0,
                transition: reduced ? 'none' : `opacity 240ms var(--ease-out) ${delay}`,
              }}
            >
              <span className="text-text-primary">
                Block {block.block} &middot; {block.layers}
              </span>
              <span className="text-text-secondary">{block.frozen ? 'frozen' : 'fine-tuned'}</span>
            </div>
          )
        })}

        <div
          className="mt-2 flex items-center justify-center gap-3"
          style={{
            opacity: entered ? 1 : 0,
            transition: reduced ? 'none' : `opacity 240ms var(--ease-out) 600ms`,
          }}
        >
          <span className="rounded-sm border border-border-subtle px-3 py-2 text-tick text-text-tertiary line-through">
            1,000-way head
          </span>
          <span
            className="h-px flex-1"
            style={{
              backgroundColor: 'var(--border-strong)',
              transform: `scaleX(${entered ? 1 : 0})`,
              transformOrigin: 'left',
              transition: reduced ? 'none' : 'transform 300ms var(--ease-out) 700ms',
            }}
          />
          <span className="rounded-sm border border-text-primary px-3 py-2 text-tick text-text-primary">
            315-way head
          </span>
        </div>
      </div>
    </Figure>
  )
}
