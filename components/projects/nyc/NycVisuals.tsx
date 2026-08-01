'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { FigureSkeleton } from '@/components/viz/FigureSkeleton'
import { useInViewOnce } from '@/lib/motion'

/**
 * Chrome for the reserved box, so a figure that has not loaded yet still shows its own title
 * instead of a grey rectangle. Each entry must match the Figure props inside the corresponding
 * component. They are duplicated here rather than imported because importing from those modules
 * would pull them into this chunk and defeat the split.
 */
const CHROME = {
  centrepiece: { eyebrow: '59,350 LISTINGS', title: 'New York, drawn by its own listings', hasCaption: true, well: { ratio: '4 / 3' } },
  imputation: { eyebrow: 'MISSING DATA', title: 'What a mean fill does to a distribution', hasCaption: true, well: { ratio: '16 / 9' } },
  location: { eyebrow: 'LIST PRICE BY BOROUGH', title: 'Five boroughs, five distributions', hasCaption: true, well: { ratio: '16 / 9' } },
  approach: { eyebrow: 'MODEL LADDER', title: 'Eight rungs from the mean to XGBoost', hasCaption: true, well: { height: 420, heightSm: 360 } },
} as const

type ChromeKey = keyof typeof CHROME

/**
 * The centrepiece's loaded component renders a legend/readout row and a five-row BoroughTable
 * below the Figure, inside this same lazy chunk. The bare FigureSkeleton only reserves the
 * Figure's own height, so this loading state adds a second placeholder block sized to match
 * that trailing content, wrapped in the same gap-4 column the loaded component uses, so the
 * chunk landing does not shift anything below it.
 */
const PriceSurfaceLazy = dynamic(
  () => import('./PriceSurface').then((m) => m.PriceSurface),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <FigureSkeleton {...CHROME.centrepiece} />
        <div aria-hidden="true" className="h-[425px] sm:h-[290px]" />
      </div>
    ),
  },
)

const ImputationSpreadLazy = dynamic(
  () => import('./ImputationSpread').then((m) => m.ImputationSpread),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.imputation} /> },
)

const BoroughSpreadLazy = dynamic(
  () => import('./BoroughSpread').then((m) => m.BoroughSpread),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.location} /> },
)

const ModelLadderLazy = dynamic(
  () => import('./ModelLadder').then((m) => m.ModelLadder),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.approach} /> },
)

/**
 * Reserves the figure's exact height before the chunk exists, and defers the import until the
 * box is within 200 px of the viewport. next/dynamic only requests a chunk when the component
 * actually renders, so gating the render gates the request. useInViewOnce returns false on the
 * server, so the exported HTML ships the skeleton and hydration cannot mismatch.
 */
function LazyVisual({ which, children }: { which: ChromeKey; children: ReactNode }) {
  const [ref, near] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  return <div ref={ref}>{near ? children : <FigureSkeleton {...CHROME[which]} />}</div>
}

export function NycCentrepiece() {
  return (
    <LazyVisual which="centrepiece">
      <PriceSurfaceLazy />
    </LazyVisual>
  )
}

export function NycImputation() {
  return (
    <LazyVisual which="imputation">
      <ImputationSpreadLazy />
    </LazyVisual>
  )
}

export function NycLocation() {
  return (
    <LazyVisual which="location">
      <BoroughSpreadLazy />
    </LazyVisual>
  )
}

export function NycApproach() {
  return (
    <LazyVisual which="approach">
      <ModelLadderLazy />
    </LazyVisual>
  )
}
