import Link from 'next/link'
import { experience } from '@/content/profile'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionFade } from '@/components/home/SectionFade'

/**
 * A condensed version of the timeline on /experience/: company, role title and dates only,
 * grouped by employer, newest role first within each group (the source order in
 * content/profile.ts). No highlight bullets, no glossary links, no per-role glyph. Those stay
 * on /experience/, which this section links out to. Location is resolved per role there and is
 * not shown here, because the employer-level value does not apply to the current role.
 */
function CondensedRoles() {
  return (
    <ol className="flex flex-col gap-8">
      {experience.map((employer) => (
        <li key={employer.company}>
          <h3 className="text-h3 text-text-primary">{employer.company}</h3>
          <ol className="mt-3 flex flex-col gap-3 border-l border-border-strong pl-4">
            {employer.roles.map((role) => (
              <li
                key={role.title}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
              >
                <span className="text-body text-text-secondary">{role.title}</span>
                <span className="text-tick whitespace-nowrap uppercase tracking-wide text-text-tertiary">
                  {role.start} to {role.end}
                </span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  )
}

/**
 * Company, role title and dates only: a scannable summary for anyone who never clicks through
 * to /experience/. The one home section with a header action, so the header row is built here
 * rather than pulled from the shared Section component, which has no action slot.
 */
export function WorkExperienceSummary() {
  return (
    <SectionFade section="work-experience">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Work Experience</Eyebrow>
            <h2 className="text-h2 mt-2 text-text-primary">Where I&apos;ve worked.</h2>
          </div>
          <Link
            href="/experience/"
            className="text-body font-medium text-accent transition-colors duration-(--dur-fast) hover:text-accent-hover"
          >
            Full experience <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="mt-(--space-block)">
          <CondensedRoles />
        </div>
      </Container>
    </SectionFade>
  )
}
