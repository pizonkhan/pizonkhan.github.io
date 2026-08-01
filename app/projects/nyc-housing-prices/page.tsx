import type { Metadata } from 'next'
import { site } from '@/content/site'
import { nycHousingPrices } from '@/content/projects/nyc-housing-prices'
import { ProjectLayout } from '@/components/project/ProjectLayout'
import { NycApproach, NycCentrepiece, NycImputation, NycLocation } from '@/components/projects/nyc/NycVisuals'

export const metadata: Metadata = {
  title: `${nycHousingPrices.title} · ${site.name}`,
  description: nycHousingPrices.tagline,
}

/**
 * Server Component: metadata plus one ProjectLayout call, nothing else. Every dynamic import
 * for this route, and the viewport-proximity gating that defers them, lives in NycVisuals.tsx,
 * a Client Component. ssr: false inside a Server Component fails npm run build outright, so
 * that split is load-bearing, not a style choice.
 */
export default function NycHousingPricesPage() {
  return (
    <ProjectLayout
      record={nycHousingPrices}
      centrepiece={<NycCentrepiece />}
      sectionVisuals={{
        imputation: <NycImputation />,
        location: <NycLocation />,
        approach: <NycApproach />,
      }}
    />
  )
}
