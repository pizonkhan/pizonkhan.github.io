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
  centrepiece: {
    eyebrow: '44,784 RECORDED SALES',
    title: 'Every home New York sold in 2025',
    hasCaption: true,
    well: { height: 560, heightSm: 620 },
  },
  models: {
    eyebrow: 'FOUR MECHANISMS',
    title: 'How each model actually fits',
    hasCaption: true,
    well: { ratio: '4 / 3', ratioSm: '16 / 9' },
  },
  ladder: {
    eyebrow: 'MODEL LADDER, 2025 DATA',
    title: 'Every rung, scored the same way',
    hasCaption: true,
    well: { height: 380, heightSm: 340 },
  },
  winner: {
    eyebrow: 'WHAT THE MODEL LEANS ON',
    title: 'Permutation importance, test set',
    hasCaption: true,
    well: { height: 520, heightSm: 460 },
  },
} as const

type ChromeKey = keyof typeof CHROME

/**
 * The centrepiece's loaded component renders a filter row, a legend, SalesDetailPanel and
 * NeighborhoodTable below the Figure, inside this same lazy chunk. The bare FigureSkeleton only
 * reserves the Figure's own height, so this loading state adds a second placeholder block sized
 * to match that trailing content, wrapped in the same gap-4 column the loaded component uses,
 * so the chunk landing does not shift anything below it. Measured against the built export.
 */
const SalesMapLazy = dynamic(
  () => import('./SalesMap').then((m) => m.SalesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4">
        <FigureSkeleton {...CHROME.centrepiece} />
        {/*
          Reserves the legend row, SalesDetailPanel and the full 25-row NeighborhoodTable that
          render below the Figure once this chunk lands, so the chunk arriving does not push the
          rest of the page down. Sized from the built markup's own box model (row heights, gaps,
          padding), not from a live layout measurement: re-measure against the deployed export
          and adjust if criterion 27's CLS budget is not met.
        */}
        <div aria-hidden="true" className="h-[1300px] sm:h-[1220px]" />
      </div>
    ),
  },
)

const ModelMechanismsLazy = dynamic(
  () => import('./ModelMechanisms').then((m) => m.ModelMechanisms),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.models} /> },
)

const ModelLadder2025Lazy = dynamic(
  () => import('./ModelLadder2025').then((m) => m.ModelLadder2025),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.ladder} /> },
)

const ImportanceBarsLazy = dynamic(
  () => import('./ImportanceBars').then((m) => m.ImportanceBars),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.winner} /> },
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

export function Nyc2025Centrepiece() {
  return (
    <LazyVisual which="centrepiece">
      <SalesMapLazy />
    </LazyVisual>
  )
}

export function Nyc2025Models() {
  return (
    <LazyVisual which="models">
      <ModelMechanismsLazy />
    </LazyVisual>
  )
}

export function Nyc2025Ladder() {
  return (
    <LazyVisual which="ladder">
      <ModelLadder2025Lazy />
    </LazyVisual>
  )
}

export function Nyc2025Winner() {
  return (
    <LazyVisual which="winner">
      <ImportanceBarsLazy />
    </LazyVisual>
  )
}
