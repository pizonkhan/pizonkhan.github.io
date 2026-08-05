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
    eyebrow: 'THE MEDALLION PATH',
    title: 'One row, generator to gold',
    hasCaption: true,
    well: { height: 660, heightSm: 320 },
  },
  pointInTime: {
    eyebrow: 'POINT IN TIME',
    title: 'The boundary that broke a join',
    hasCaption: true,
    well: { height: 400, heightSm: 340 },
  },
  scd: {
    eyebrow: 'TYPE 6 HYBRID',
    title: 'Five versions of one subscriber',
    hasCaption: true,
    well: { height: 680, heightSm: 380 },
  },
  wap: {
    eyebrow: 'WRITE, AUDIT, PUBLISH',
    title: 'Two runs, one of them blocked',
    hasCaption: true,
    well: { height: 460, heightSm: 390 },
  },
  atomicity: {
    eyebrow: 'ATOMIC COMMIT',
    title: 'A write killed on purpose',
    hasCaption: true,
    well: { height: 430, heightSm: 360 },
  },
} as const

type ChromeKey = keyof typeof CHROME

const MedallionFlowLazy = dynamic(
  () => import('./MedallionFlow').then((m) => m.MedallionFlow),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.centrepiece} /> },
)

const IntervalJoinLazy = dynamic(
  () => import('./IntervalJoin').then((m) => m.IntervalJoin),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.pointInTime} /> },
)

const SubscriberVersionsLazy = dynamic(
  () => import('./SubscriberVersions').then((m) => m.SubscriberVersions),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.scd} /> },
)

const WapGateLazy = dynamic(
  () => import('./WapGate').then((m) => m.WapGate),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.wap} /> },
)

const AtomicCommitLazy = dynamic(
  () => import('./AtomicCommit').then((m) => m.AtomicCommit),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.atomicity} /> },
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

export function LakehouseCentrepiece() {
  return (
    <LazyVisual which="centrepiece">
      <MedallionFlowLazy />
    </LazyVisual>
  )
}

export function LakehousePointInTime() {
  return (
    <LazyVisual which="pointInTime">
      <IntervalJoinLazy />
    </LazyVisual>
  )
}

export function LakehouseScd() {
  return (
    <LazyVisual which="scd">
      <SubscriberVersionsLazy />
    </LazyVisual>
  )
}

export function LakehouseWap() {
  return (
    <LazyVisual which="wap">
      <WapGateLazy />
    </LazyVisual>
  )
}

export function LakehouseAtomicity() {
  return (
    <LazyVisual which="atomicity">
      <AtomicCommitLazy />
    </LazyVisual>
  )
}
