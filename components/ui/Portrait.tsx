import clsx from 'clsx'
import { withBasePath } from '@/lib/base-path'

export interface PortraitProps {
  /** Rendered CSS size in px. 88 | 120 | 240 are the only sanctioned values. */
  size: 88 | 120 | 240
  shape: 'circle' | 'rect'
  /** Eager only for the hero instance. */
  priority?: boolean
  /** Optional mono caption rendered beneath, left-aligned. */
  caption?: string
  className?: string
}

/**
 * The portrait primitive. Fixed sizes, fixed crop, one swappable pair of source files. A
 * better photograph later means replacing the two files in public/img/ at the same
 * dimensions: zero code change here.
 */
export function Portrait({ size, shape, priority, caption, className }: PortraitProps) {
  return (
    <div className={clsx('inline-flex flex-col items-start gap-2', className)}>
      <span
        className="block overflow-hidden shadow-[inset_0_0_0_1px_var(--border-subtle)]"
        style={{
          width: size,
          height: size,
          borderRadius: shape === 'circle' ? 'var(--radius-full)' : 'var(--radius-md)',
        }}
      >
        <img
          src={withBasePath('/img/portrait-640.webp')}
          srcSet={`${withBasePath('/img/portrait-256.webp')} 256w, ${withBasePath('/img/portrait-640.webp')} 640w`}
          sizes={`${size}px`}
          width={640}
          height={640}
          alt="Pizon Khan"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'low' : undefined}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </span>
      {caption && <span className="text-tick text-text-tertiary">{caption}</span>}
    </div>
  )
}
