'use client'

import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { Container, type ContainerProps } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'

export interface SectionProps {
  id?: string
  eyebrow?: string
  heading?: string
  width?: ContainerProps['width']
  children: ReactNode
  className?: string
}

/**
 * Vertical rhythm for a page section, an optional eyebrow/heading pair, and the one-shot
 * scroll-reveal every section on the site shares: opacity 0->1, translateY(12px)->0, on first
 * entry into view, never re-firing on scroll back.
 */
export function Section({ id, eyebrow, heading, width, children, className }: SectionProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered

  return (
    <section
      id={id}
      ref={ref}
      className={clsx('py-(--space-section)', className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(12px)',
        transition: reduced
          ? 'opacity var(--dur-fast) var(--ease-out)'
          : 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
      }}
    >
      <Container width={width}>
        {(eyebrow || heading) && (
          <div className="mb-(--space-block)">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {heading && <h2 className="mt-2 text-h2 text-text-primary">{heading}</h2>}
          </div>
        )}
        {children}
      </Container>
    </section>
  )
}
