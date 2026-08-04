import type { Metadata } from 'next'
import { site } from '@/content/site'
import { siteAnalytics } from '@/content/projects/site-analytics'
import { ProjectLayout } from '@/components/project/ProjectLayout'
import { AnalyticsCentrepiece, AnalyticsPipeline } from '@/components/projects/analytics/AnalyticsVisuals'

export const metadata: Metadata = {
  title: `${siteAnalytics.title} · ${site.name}`,
  description: siteAnalytics.tagline,
}

/**
 * Server Component: metadata plus one ProjectLayout call, nothing else. Every dynamic import
 * for this route, and the viewport-proximity gating that defers them, lives in
 * AnalyticsVisuals.tsx, a Client Component. ssr: false inside a Server Component fails
 * npm run build outright, so that split is load-bearing, not a style choice.
 */
export default function SiteAnalyticsPage() {
  return (
    <ProjectLayout
      record={siteAnalytics}
      centrepiece={<AnalyticsCentrepiece />}
      sectionVisuals={{ pipeline: <AnalyticsPipeline /> }}
    />
  )
}
