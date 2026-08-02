'use client'

import { withBasePath } from '@/lib/base-path'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { useBirdAsset } from './useBirdAsset'

interface ActivationBlockEntry {
  block: number
  layer: string
  outputShape: [number, number, number]
  channels: number[]
  caption: string
}

interface ActivationsAsset {
  sourceImage: {
    subject: string
    photographer: string
    sourceUrl: string
    license: string
  }
  blocks: ActivationBlockEntry[]
}

export interface ActivationStripProps {
  /** 1 through 5, the VGG16 block whose channels are shown. */
  block: number
}

/**
 * Six real channel thumbnails for one VGG16 block, cropped from a 576x96 sprite sheet (six
 * 96x96 tiles) produced by a stock ImageNet VGG16 forward pass on the shipped source photo.
 * Owns no Figure wrapper: it is embedded inside LayerPyramid's well, the way
 * PriceCellMap is embedded inside PriceSurface's.
 */
export function ActivationStrip({ block }: ActivationStripProps) {
  const asset = useBirdAsset<ActivationsAsset>('activations.json')
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  // The ref lives on a wrapper rendered in every asset state, loading and error included, so
  // useInViewOnce's IntersectionObserver has a node to attach to from first paint rather than
  // only once the fetch resolves and the real content mounts.
  if (asset.status === 'loading') {
    return (
      <div ref={ref}>
        <p className="text-tick text-text-tertiary">Loading the activations for block {block}.</p>
      </div>
    )
  }
  if (asset.status === 'error') {
    return (
      <div ref={ref}>
        <p className="text-tick text-text-tertiary">Could not load the activation sprites.</p>
      </div>
    )
  }

  const entry = asset.data.blocks.find((b) => b.block === block)
  if (!entry) return <div ref={ref} />

  const spriteUrl = withBasePath(`/projects/bird-species-cnn/activations/block${block}.webp`)
  const ariaLabel =
    `Six activation channel thumbnails from ${entry.layer}, channel indices ${entry.channels.join(', ')}. ${entry.caption}`

  return (
    <div ref={ref} className="flex flex-col gap-2">
      <p className="text-tick text-text-secondary">
        {entry.layer} &middot; {entry.outputShape.join(' x ')} &middot; {entry.caption}
      </p>
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-6" role="img" aria-label={ariaLabel}>
        {entry.channels.map((channelIndex, i) => (
          <div
            key={channelIndex}
            className="aspect-square overflow-hidden rounded-sm"
            style={{
              backgroundImage: `url(${spriteUrl})`,
              backgroundSize: '600% 100%',
              backgroundPositionX: `${(i / 5) * 100}%`,
              backgroundPositionY: '0%',
              boxShadow: 'inset 0 0 0 0.5px var(--viz-hairline)',
              opacity: entered ? 1 : 0,
              transition: reduced ? 'none' : `opacity 240ms var(--ease-out) ${Math.min(i, 7) * 40}ms`,
            }}
          />
        ))}
      </div>
      <p className="text-tick text-text-tertiary">
        Source photo: {asset.data.sourceImage.subject}, {asset.data.sourceImage.photographer}.{' '}
        {asset.data.sourceImage.license}.
      </p>
    </div>
  )
}
