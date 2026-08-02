'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { experience, type Employer, type Role } from '@/content/profile'
import { DURATION, EASE, STAGGER, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'

interface RoleEntry {
  employer: Employer
  role: Role
}

/**
 * Every employer, role, date range and highlight bullet, rendered verbatim from
 * content/profile.ts. A vertical rule draws down the timeline as the reader scrolls, and role
 * cards reveal staggered on first view. Both are disabled under reduced motion, where the
 * rule is fully drawn from the start and every card is already visible.
 */
export function RoleTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.4'],
  })
  const ruleScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  const roleEntries: RoleEntry[] = experience.flatMap((employer) =>
    employer.roles.map((role) => ({ employer, role })),
  )

  return (
    <div ref={containerRef} className="relative pl-8">
      <div className="absolute inset-y-0 left-2 w-px bg-border-subtle" aria-hidden="true">
        <motion.div
          className="h-full w-px origin-top bg-border-strong"
          style={{ scaleY: reduced ? 1 : ruleScale }}
        />
      </div>
      <ol className="flex flex-col gap-(--space-block)">
        {roleEntries.map((entry, index) => (
          <RoleCard key={`${entry.employer.company}-${entry.role.title}`} index={index} {...entry} />
        ))}
      </ol>
    </div>
  )
}

function RoleCard({ employer, role, index }: RoleEntry & { index: number }) {
  const [ref, hasEntered] = useInViewOnce<HTMLLIElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered
  const hiddenY = reduced ? 0 : 12

  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, y: hiddenY }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: hiddenY }}
      transition={
        reduced
          ? { opacity: { duration: DURATION.fast, ease: EASE.out }, y: { duration: 0 } }
          : { duration: DURATION.slow, ease: EASE.out, delay: Math.min(index, 8) * STAGGER }
      }
      className="relative"
    >
      <span className="absolute -left-8 top-1.5 h-2 w-2 rounded-full bg-text-tertiary" aria-hidden="true" />
      <p className="text-tick uppercase tracking-wide text-text-tertiary">
        {role.start} to {role.end}
      </p>
      <h3 className="text-h3 mt-1 text-text-primary">{role.title}</h3>
      <p className="text-small text-text-secondary">
        {employer.company} · {role.location ?? employer.location}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {role.highlights.map((point) => (
          <li key={point.slice(0, 40)} className="max-w-(--measure-prose) text-body text-text-secondary">
            {point}
          </li>
        ))}
      </ul>
    </motion.li>
  )
}
