'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'

/**
 * One-shot section reveal for '/': opacity 0 to 1 on first entry into view, never re-firing.
 * Takes children so the section content can stay server-rendered and its data never reaches
 * the client bundle. No framer-motion and no shared Section wrapper: see components/home/Hero.tsx
 * for why this route pays for neither.
 */
export function SectionFade({ children, section }: { children: ReactNode; section?: string }) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered

  return (
    <div
      ref={ref}
      data-section={section}
      className={clsx(
        'py-(--space-section) transition-opacity duration-(--dur-slow) ease-out',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {children}
    </div>
  )
}
