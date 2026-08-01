import { Hero } from '@/components/home/Hero'
import { ProofStrip } from '@/components/home/ProofStrip'
import { DemonstrationsPreview } from '@/components/home/DemonstrationsPreview'
import { CapabilityGrid } from '@/components/home/CapabilityGrid'
import { ContactBlock } from '@/components/home/ContactBlock'

export default function Home() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <DemonstrationsPreview />
      <CapabilityGrid />
      <ContactBlock />
    </>
  )
}
