'use client'

import clsx from 'clsx'
import { profile } from '@/content/profile'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Portrait } from '@/components/ui/Portrait'

/**
 * Portrait, email and links. The one place a recruiter is looking for a face, and 240px is
 * the largest size the source photograph honestly supports. No motion beyond one
 * section-level fade, kept in plain CSS: see components/home/Hero.tsx for why '/' avoids
 * framer-motion.
 */
export function ContactBlock() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const visible = reduced || hasEntered

  return (
    <div
      ref={ref}
      data-section="contact"
      className={clsx(
        'py-(--space-section) transition-opacity duration-(--dur-slow) ease-out',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <Container>
        <Eyebrow>Contact</Eyebrow>
        <h2 className="text-h2 mt-2 text-text-primary">Get in touch.</h2>
        <div className="mt-(--space-block) grid grid-cols-1 items-start gap-10 md:grid-cols-[240px_1fr]">
          <Portrait size={240} shape="rect" />
          <div className="flex flex-col gap-4">
            <a
              href={`mailto:${profile.email}`}
              className="text-lead text-text-primary transition-colors duration-(--dur-fast) hover:text-accent"
            >
              {profile.email}
            </a>
            <div className="flex flex-wrap gap-6 text-body text-text-secondary">
              <a
                href={profile.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary"
              >
                GitHub
              </a>
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
