'use client'

import clsx from 'clsx'
import { skills } from '@/content/profile'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Pill } from '@/components/ui/Pill'

/**
 * The five skill groups from profile.skills, as a responsive definition list. Exists so the
 * page is honest about breadth without the hero having to carry a tag cloud. No motion beyond
 * one section-level fade, kept in plain CSS: see components/home/Hero.tsx for why '/' avoids
 * framer-motion.
 */
export function CapabilityGrid() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered

  return (
    <div
      ref={ref}
      className={clsx(
        'py-(--space-section) transition-opacity duration-(--dur-slow) ease-out',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Container>
        <Eyebrow>Capabilities</Eyebrow>
        <h2 className="text-h2 mt-2 text-text-primary">Tools, platforms and methods.</h2>
        <dl className="mt-(--space-block) grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((group) => (
            <div key={group.group}>
              <dt>
                <Eyebrow>{group.group}</Eyebrow>
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Pill key={item}>{item}</Pill>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  )
}
