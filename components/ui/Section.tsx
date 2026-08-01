'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { DURATION, EASE, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
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
  const hiddenY = reduced ? 0 : 12

  return (
    <motion.section
      id={id}
      ref={ref}
      className={clsx('py-(--space-section)', className)}
      initial={{ opacity: 0, y: hiddenY }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: hiddenY }}
      transition={
        reduced
          ? { opacity: { duration: DURATION.fast, ease: EASE.out }, y: { duration: 0 } }
          : { duration: DURATION.slow, ease: EASE.out }
      }
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
    </motion.section>
  )
}
