import type { Metadata } from 'next'
import { site } from '@/content/site'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { RoleTimeline } from '@/components/experience/RoleTimeline'
import { SkillMatrix } from '@/components/experience/SkillMatrix'
import { EducationList } from '@/components/experience/EducationList'
import { TechniqueNotes } from '@/components/experience/TechniqueNotes'

export const metadata: Metadata = {
  title: `Experience · ${site.name}`,
  description:
    'Roles, skills and education, in text, sourced entirely from the résumé. The bank work '
    + 'carries no chart or photograph, and its numbers appear nowhere else on this site.',
}

/**
 * Where the bank work lives, without a demonstration attached. Text only, sourced entirely
 * from the résumé data module: no chart, no photograph, and no import from any
 * visualisation or personal-project directory. See the plan's employment-boundary rule.
 */
export default function ExperiencePage() {
  return (
    <>
      <div className="border-b border-border-subtle py-(--space-block)">
        <Container>
          <Eyebrow>Experience</Eyebrow>
          <h1 className="text-h1 mt-3 text-text-primary">Credentials, stated plainly.</h1>
          <p className="text-lead mt-4 max-w-(--measure-prose) text-text-secondary">
            Everything below comes from the résumé: employers, roles, dates and results, with
            no demonstration attached, because bank work cannot carry one.
          </p>
        </Container>
      </div>
      <Section eyebrow="Roles" heading="Every role, verbatim from the résumé.">
        <RoleTimeline />
      </Section>
      <Section eyebrow="Skills" heading="What I work with.">
        <SkillMatrix />
      </Section>
      <Section eyebrow="Education" heading="Education.">
        <EducationList />
      </Section>
      <Section eyebrow="Method" heading="How the models work, in general terms.">
        <TechniqueNotes />
      </Section>
      <div className="border-t border-border-subtle py-(--space-section)">
        <Container>
          <ButtonLink href="/projects/">The work I can show you in full →</ButtonLink>
        </Container>
      </div>
    </>
  )
}
