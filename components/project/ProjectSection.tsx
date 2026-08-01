'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { DURATION, EASE, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { Container } from '@/components/ui/Container'
import { Prose } from '@/components/ui/Prose'

export interface ProjectSectionProps {
  /** Stable anchor id. Also the sectionVisuals key. */
  id: string
  heading: string
  /** One string per paragraph. */
  body: string[]
  /** The visual demonstrating this section's idea. Already wrapped in Figure by its owner. */
  visual?: ReactNode
  /** Declared on the content record; drives the development-time missing-visual check. */
  hasVisual?: boolean
}

/**
 * One theory section: a self-linking heading, the argument in prose at the 68ch measure, and
 * the visual that proves it, placed after the prose and outside the prose measure so a figure
 * can run to the content width. Fires its own scroll-reveal; the visual runs its own first-view
 * animation independently, so a long section does not fire its figure before the reader arrives.
 */
export function ProjectSection({ id, heading, body, visual }: ProjectSectionProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered
  const hiddenY = reduced ? 0 : 12

  return (
    <motion.section
      id={id}
      ref={ref}
      className="py-(--space-section)"
      initial={{ opacity: 0, y: hiddenY }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: hiddenY }}
      transition={
        reduced
          ? { opacity: { duration: DURATION.fast, ease: EASE.out }, y: { duration: 0 } }
          : { duration: DURATION.slow, ease: EASE.out }
      }
    >
      <Container>
        <h2 className="text-h2 text-text-primary">
          <a href={`#${id}`} className="no-underline hover:underline">
            {heading}
          </a>
        </h2>
        <div className="mt-(--space-block)">
          <Prose>
            {body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </Prose>
        </div>
        {visual && <div className="mt-(--space-block)">{visual}</div>}
      </Container>
    </motion.section>
  )
}
