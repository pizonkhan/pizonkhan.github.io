'use client'

import clsx from 'clsx'
import { projects } from '@/content/projects'
import { STAGGER, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ProjectCard } from '@/components/project/ProjectCard'

/**
 * The project cards from the registry, staggered in on first view. Plain CSS transitions
 * rather than framer-motion: see Hero.tsx for why '/' avoids the animation library.
 */
export function DemonstrationsPreview() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered

  return (
    <div className="py-(--space-section)" ref={ref}>
      <Container>
        <Eyebrow>Work</Eyebrow>
        <h2 className="text-h2 mt-2 text-text-primary">The project pages are the demonstration.</h2>
        <p className="text-lead mt-4 max-w-(--measure-prose) text-text-secondary">
          A link to a repo proves nothing. These pages run the work in front of you.
        </p>
        <div className="mt-(--space-block) grid grid-cols-1 gap-6 sm:grid-cols-2">
          {projects.map((record, index) => (
            <div
              key={record.slug}
              className={clsx(
                'transition-[opacity,transform] duration-(--dur-slow) ease-out',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
              )}
              style={{ transitionDelay: reduced ? undefined : `${Math.min(index, 8) * STAGGER * 1000}ms` }}
            >
              <ProjectCard record={record} variant="home" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}
