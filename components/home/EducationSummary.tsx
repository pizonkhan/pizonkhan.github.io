import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionFade } from '@/components/home/SectionFade'
import { EducationList } from '@/components/experience/EducationList'

/**
 * The same education entries shown on /experience/, reused as-is rather than re-authored.
 * Server component: passed as children to SectionFade so the education data never enters
 * the client bundle for '/'.
 */
export function EducationSummary() {
  return (
    <SectionFade section="education">
      <Container>
        <Eyebrow>Education</Eyebrow>
        <h2 className="text-h2 mt-2 text-text-primary">Where I studied.</h2>
        <div className="mt-(--space-block)">
          <EducationList />
        </div>
      </Container>
    </SectionFade>
  )
}
