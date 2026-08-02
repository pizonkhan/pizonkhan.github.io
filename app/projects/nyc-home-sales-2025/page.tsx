import type { Metadata } from 'next'
import { site } from '@/content/site'
import { nycHomeSales2025 } from '@/content/projects/nyc-home-sales-2025'
import { ProjectLayout } from '@/components/project/ProjectLayout'
import {
  Nyc2025Centrepiece,
  Nyc2025Ladder,
  Nyc2025Models,
  Nyc2025Winner,
} from '@/components/projects/nyc2025/Nyc2025Visuals'

export const metadata: Metadata = {
  title: `${nycHomeSales2025.title} · ${site.name}`,
  description: nycHomeSales2025.tagline,
}

/**
 * Server Component: metadata plus one ProjectLayout call, nothing else. Every dynamic import
 * for this route, and the viewport-proximity gating that defers them, lives in
 * Nyc2025Visuals.tsx, a Client Component. ssr: false inside a Server Component fails
 * npm run build outright, so that split is load-bearing, not a style choice.
 */
export default function NycHomeSales2025Page() {
  return (
    <ProjectLayout
      record={nycHomeSales2025}
      centrepiece={<Nyc2025Centrepiece />}
      sectionVisuals={{
        models: <Nyc2025Models />,
        ladder: <Nyc2025Ladder />,
        winner: <Nyc2025Winner />,
      }}
    />
  )
}
