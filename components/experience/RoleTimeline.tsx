'use client'

import clsx from 'clsx'
import { experience, type Employer, type Role } from '@/content/profile'
import { roleGlyphs } from '@/content/experience/roles'
import { highlightAnnotations } from '@/content/experience/glossary'
import { roleKey, type HighlightAnnotation } from '@/lib/glossary'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { RoleGlyph } from './RoleGlyph'
import { AnnotatedHighlight } from './AnnotatedHighlight'

interface RoleEntry {
  employer: Employer
  role: Role
}

const EMPTY_ANNOTATIONS: readonly HighlightAnnotation[] = []

function annotationsFor(key: string, index: number): readonly HighlightAnnotation[] {
  return highlightAnnotations[key]?.[index] ?? EMPTY_ANNOTATIONS
}

/**
 * Every employer, role, date range and highlight bullet, rendered unchanged from
 * content/profile.ts. Each role card draws its own rule segment and reveals once it enters
 * view, so the rule still appears to draw down the page as the reader scrolls, one shot, never
 * re-firing. Disabled under reduced motion, where every card and every segment is already in
 * its final state.
 */
export function RoleTimeline() {
  const reduced = usePrefersReducedMotion()

  const roleEntries: RoleEntry[] = experience.flatMap((employer) =>
    employer.roles.map((role) => ({ employer, role })),
  )

  return (
    <div className="relative pl-8">
      <ol className="flex flex-col">
        {roleEntries.map((entry, index) => (
          <RoleCard
            key={`${entry.employer.company}-${entry.role.title}`}
            employer={entry.employer}
            role={entry.role}
            isLast={index === roleEntries.length - 1}
            reduced={reduced}
          />
        ))}
      </ol>
    </div>
  )
}

function RoleCard({
  employer,
  role,
  isLast,
  reduced,
}: RoleEntry & { isLast: boolean; reduced: boolean }) {
  const [ref, hasEntered] = useInViewOnce<HTMLLIElement>()
  const visible = reduced || hasEntered
  const key = roleKey(employer.company, role.title)
  const kind = roleGlyphs[key]

  return (
    <li
      ref={ref}
      className={clsx('relative', !isLast && 'pb-(--space-block)')}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(12px)',
        transition: reduced
          ? 'opacity var(--dur-fast) var(--ease-out)'
          : 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -left-6 top-0 bottom-0 w-px origin-top bg-border-strong"
        style={{
          transform: visible ? 'scaleY(1)' : 'scaleY(0)',
          transition: reduced ? 'none' : 'transform var(--dur-slow) var(--ease-out)',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute -left-8 top-1.5 h-2 w-2 rounded-full bg-text-tertiary"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-tick uppercase tracking-wide text-text-tertiary">
            {role.start} to {role.end}
          </p>
          <h3 className="text-h3 mt-1 text-text-primary">{role.title}</h3>
          <p className="text-small text-text-secondary">
            {employer.company} · {role.location ?? employer.location}
          </p>
        </div>
        {kind && (
          <RoleGlyph
            kind={kind}
            revealed={visible}
            reduced={reduced}
            className="h-16 w-16 shrink-0 sm:h-22 sm:w-22"
          />
        )}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {role.highlights.map((point, i) => (
          <li key={point.slice(0, 40)} className="max-w-(--measure-prose) text-body text-text-secondary">
            <AnnotatedHighlight text={point} annotations={annotationsFor(key, i)} />
          </li>
        ))}
      </ul>
    </li>
  )
}
