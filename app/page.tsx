import { Hero } from '@/components/home/Hero'
import { EducationSummary } from '@/components/home/EducationSummary'
import { BusinessSummary } from '@/components/home/BusinessSummary'
import { WorkExperienceSummary } from '@/components/home/WorkExperienceSummary'
import { ProofStrip } from '@/components/home/ProofStrip'
import { DemonstrationsPreview } from '@/components/home/DemonstrationsPreview'
import { AnalyticsSummary } from '@/components/home/AnalyticsSummary'
import { ContactBlock } from '@/components/home/ContactBlock'

export default function Home() {
  return (
    <>
      <Hero />
      <EducationSummary />
      <BusinessSummary />
      <WorkExperienceSummary />
      <ProofStrip />
      <DemonstrationsPreview />
      <AnalyticsSummary />
      <ContactBlock />
    </>
  )
}
