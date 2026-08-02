'use client'

import clsx from 'clsx'
import { withBasePath } from '@/lib/base-path'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import { BIRD_GALLERY } from '@/content/data/bird-gallery'

export interface BirdGalleryProps {
  /** Species id from content/data/bird-gallery.ts. */
  value: string
  onChange: (id: string) => void
  /** Called on pointerenter and focus so the next bird's softmax is already in cache. */
  onPrefetch?: (id: string) => void
}

const GALLERY_IDS = BIRD_GALLERY.map((bird) => bird.id)

/**
 * The eight-thumbnail picker that drives SoftmaxRace. Owns selection only: the softmax data,
 * the narrowing stages and every Figure chrome belong to the figure this sits inside.
 */
export function BirdGallery({ value, onChange, onPrefetch }: BirdGalleryProps) {
  const { groupProps, getRadioProps } = useRovingRadioGroup(GALLERY_IDS, value, onChange)

  return (
    <div
      role="radiogroup"
      aria-label="Bird photograph"
      className="flex gap-2 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] sm:flex-wrap sm:overflow-visible sm:pb-0"
      {...groupProps}
    >
      {BIRD_GALLERY.map((bird) => {
        const isSelected = bird.id === value
        return (
          <button
            key={bird.id}
            type="button"
            {...getRadioProps(bird.id)}
            onPointerEnter={() => onPrefetch?.(bird.id)}
            onFocus={() => onPrefetch?.(bird.id)}
            className={clsx(
              'relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm transition-opacity duration-(--dur-fast) [scroll-snap-align:start]',
              isSelected ? 'opacity-100 ring-2 ring-accent' : 'opacity-60 hover:opacity-100',
            )}
          >
            <img
              src={withBasePath(`/projects/bird-species-cnn/gallery/${bird.id}/thumb-96.webp`)}
              width={96}
              height={96}
              alt=""
              className="block h-full w-full object-cover"
            />
            <span className="sr-only">
              {bird.common}
              {isSelected ? ', selected [x]' : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
