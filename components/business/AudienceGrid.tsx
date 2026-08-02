'use client'

import clsx from 'clsx'
import { business } from '@/content/business'
import { STAGGER, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { BusinessGlyph } from './BusinessGlyph'

export interface AudienceGridProps {
  className?: string
}

/**
 * The three audiences (customers, chauffeurs, the office), staggered in on first view.
 * Follows the same in-view-once and stagger pattern as DemonstrationsPreview.
 */
export function AudienceGrid({ className }: AudienceGridProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLUListElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered

  return (
    <ul ref={ref} className={clsx('grid grid-cols-1 gap-6 sm:grid-cols-3', className)}>
      {business.platform.audiences.map((audience, index) => {
        const delayMs = index * STAGGER * 1000
        return (
          <li
            key={audience.id}
            className={clsx(
              'flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-1 p-6 shadow-card',
              'transition-[opacity,transform] duration-(--dur-slow) ease-out',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
            )}
            style={{ transitionDelay: reduced ? undefined : `${delayMs}ms` }}
          >
            <BusinessGlyph
              kind={audience.glyph}
              revealed={visible}
              reduced={reduced}
              delayMs={delayMs}
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
            <h3 className="text-h3 text-text-primary">{audience.title}</h3>
            <p className="text-small text-text-secondary">{audience.body}</p>
          </li>
        )
      })}
    </ul>
  )
}
