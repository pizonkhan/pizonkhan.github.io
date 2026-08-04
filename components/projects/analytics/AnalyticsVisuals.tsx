'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { FigureSkeleton } from '@/components/viz/FigureSkeleton'
import { useInViewOnce } from '@/lib/motion'

/**
 * Chrome for the reserved box, so a figure that has not loaded yet still shows its own title
 * instead of a grey rectangle. Duplicated from AnalyticsDashboard.tsx and PipelineFlow.tsx
 * rather than imported, so importing this module never pulls the dashboard's own code into the
 * page's first-load chunk: that is the whole point of the split.
 */
const CHROME = {
  dashboard: {
    eyebrow: 'DAILY TRAFFIC',
    title: 'Page views and visits, by day',
    hasCaption: true,
    well: { height: 320, heightSm: 300 },
  },
  pipeline: {
    eyebrow: 'THE PIPELINE',
    title: 'From a beacon to a row on this page',
    hasCaption: true,
    well: { height: 220, heightSm: 420 },
  },
} as const

type ChromeKey = keyof typeof CHROME

/**
 * AnalyticsDashboard and PipelineSection are two named exports of the same module, so both
 * dynamic() calls below resolve to one underlying chunk: whichever of the centrepiece or the
 * pipeline section scrolls into view first is the one that actually triggers the download, and
 * the other mount point reads it from the same request rather than fetching a second time.
 */
const AnalyticsDashboardLazy = dynamic(
  () => import('./AnalyticsDashboard').then((m) => m.AnalyticsDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <FigureSkeleton {...CHROME.dashboard} />
        {/*
          Reserves the headline numbers row, the window control and the four remaining figures
          (top pages, top clicks, the histogram, the audience breakdown) that render below the
          first chart once this chunk lands, so the chunk arriving does not push the rest of the
          page down. Heights measured against the built export's loading layout at each
          breakpoint; re-measure and adjust here if AnalyticsDashboard.tsx's chrome changes.
        */}
        <div aria-hidden="true" className="h-[2500px] sm:h-[2500px] lg:h-[1550px]" />
      </div>
    ),
  },
)

const PipelineSectionLazy = dynamic(
  () => import('./AnalyticsDashboard').then((m) => m.PipelineSection),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.pipeline} /> },
)

/**
 * Reserves the figure's exact height before the chunk exists, and defers the import until the
 * box is within 200 px of the viewport, exactly like Nyc2025Visuals.tsx's LazyVisual.
 */
function LazyVisual({ which, children }: { which: ChromeKey; children: ReactNode }) {
  const [ref, near] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  return <div ref={ref}>{near ? children : <FigureSkeleton {...CHROME[which]} />}</div>
}

export function AnalyticsCentrepiece() {
  return (
    <LazyVisual which="dashboard">
      <AnalyticsDashboardLazy />
    </LazyVisual>
  )
}

export function AnalyticsPipeline() {
  return (
    <LazyVisual which="pipeline">
      <PipelineSectionLazy />
    </LazyVisual>
  )
}
