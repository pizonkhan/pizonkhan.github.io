import type { Metadata } from 'next'
import { site } from '@/content/site'
import { birdSpeciesCnn } from '@/content/projects/bird-species-cnn'
import { ProjectLayout } from '@/components/project/ProjectLayout'
import {
  BirdConvolution,
  BirdDecision,
  BirdDepth,
  BirdPixels,
  BirdResults,
  BirdTransfer,
} from '@/components/projects/bird/BirdVisuals'

export const metadata: Metadata = {
  title: `${birdSpeciesCnn.title} · ${site.name}`,
  description: birdSpeciesCnn.tagline,
}

/**
 * Server Component: metadata plus one ProjectLayout call, nothing else. Every dynamic import
 * for this route, and the viewport-proximity gating that defers them, lives in
 * BirdVisuals.tsx, a Client Component. ssr: false inside a Server Component fails
 * npm run build outright, so that split is load-bearing, not a style choice.
 */
export default function BirdSpeciesCnnPage() {
  return (
    <ProjectLayout
      record={birdSpeciesCnn}
      centrepiece={<BirdResults />}
      sectionVisuals={{
        pixels: <BirdPixels />,
        convolution: <BirdConvolution />,
        depth: <BirdDepth />,
        decision: <BirdDecision />,
        transfer: <BirdTransfer />,
      }}
    />
  )
}
