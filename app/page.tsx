import { Hero } from '@/components/home/Hero'
import { EducationSummary } from '@/components/home/EducationSummary'
import { WorkExperienceSummary } from '@/components/home/WorkExperienceSummary'
import { ProofStrip } from '@/components/home/ProofStrip'
import { DemonstrationsPreview } from '@/components/home/DemonstrationsPreview'
import { ContactBlock } from '@/components/home/ContactBlock'

export default function Home() {
  return (
    <>
      <Hero />
      <EducationSummary />
      <WorkExperienceSummary />
      <ProofStrip />
      <DemonstrationsPreview />
      <ContactBlock />
    </>
  )
}
