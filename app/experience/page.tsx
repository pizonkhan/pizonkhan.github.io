import type { Metadata } from 'next'
import { site } from '@/content/site'
import { experienceIntro } from '@/content/experience/intro'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { RoleTimeline } from '@/components/experience/RoleTimeline'
import { SkillMatrix } from '@/components/experience/SkillMatrix'
import { EducationList } from '@/components/experience/EducationList'
import { ConceptNotes } from '@/components/experience/ConceptNotes'

export const metadata: Metadata = {
  title: `Experience · ${site.name}`,
  description: experienceIntro.metaDescription,
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
          <h1 className="text-h1 mt-3 text-text-primary">{experienceIntro.heading}</h1>
          <p className="text-lead mt-4 max-w-(--measure-prose) text-text-secondary">
            {experienceIntro.paragraph}
          </p>
        </Container>
      </div>
      <Section id="roles" className="scroll-mt-24" eyebrow="Roles" heading="Every role, most recent first.">
        <RoleTimeline />
      </Section>
      <Section eyebrow="Skills" heading="What I work with.">
        <SkillMatrix />
      </Section>
      <Section eyebrow="Education" heading="Where I studied.">
        <EducationList />
      </Section>
      <Section id="concepts" eyebrow="Concepts" heading="The methods, in general terms.">
        <ConceptNotes />
      </Section>
      <div className="border-t border-border-subtle py-(--space-section)">
        <Container>
          <ButtonLink href="/projects/">The work I can show you in full →</ButtonLink>
        </Container>
      </div>
    </>
  )
}
