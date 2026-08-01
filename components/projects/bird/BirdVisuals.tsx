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
  centrepiece: { eyebrow: 'EIGHT CHECKPOINTS', title: 'From chance to 97.651%', hasCaption: true, well: { height: 500, heightSm: 360 } },
  pixels: { eyebrow: 'PIXELS', title: 'An image is a matrix of numbers', hasCaption: true, well: { ratio: '1 / 1' } },
  convolution: { eyebrow: 'CONVOLUTION', title: 'A filter is nine numbers', hasCaption: true, well: { ratio: '2 / 1' } },
  depth: { eyebrow: 'VGG16 DEPTH', title: 'Space shrinks, meaning accumulates', hasCaption: true, well: { height: 540, heightSm: 420 } },
  decision: { eyebrow: 'SOFTMAX', title: '4,096 numbers become one bird', hasCaption: true, well: { height: 480, heightSm: 360 } },
  transfer: { eyebrow: 'TRANSFER LEARNING', title: 'Five blocks, two states, one new head', hasCaption: true, well: { height: 340, heightSm: 300 } },
} as const

type ChromeKey = keyof typeof CHROME

const ResultsLadderLazy = dynamic(
  () => import('./ResultsLadder').then((m) => m.ResultsLadder),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.centrepiece} /> },
)

const PixelMatrixLazy = dynamic(
  () => import('./PixelMatrix').then((m) => m.PixelMatrix),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.pixels} /> },
)

const ConvolutionSweepLazy = dynamic(
  () => import('./ConvolutionSweep').then((m) => m.ConvolutionSweep),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.convolution} /> },
)

const LayerPyramidLazy = dynamic(
  () => import('./LayerPyramid').then((m) => m.LayerPyramid),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.depth} /> },
)

const SoftmaxRaceLazy = dynamic(
  () => import('./SoftmaxRace').then((m) => m.SoftmaxRace),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.decision} /> },
)

const TransferDiagramLazy = dynamic(
  () => import('./TransferDiagram').then((m) => m.TransferDiagram),
  { ssr: false, loading: () => <FigureSkeleton {...CHROME.transfer} /> },
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

export function BirdResults() {
  return (
    <LazyVisual which="centrepiece">
      <ResultsLadderLazy />
    </LazyVisual>
  )
}

export function BirdPixels() {
  return (
    <LazyVisual which="pixels">
      <PixelMatrixLazy />
    </LazyVisual>
  )
}

export function BirdConvolution() {
  return (
    <LazyVisual which="convolution">
      <ConvolutionSweepLazy />
    </LazyVisual>
  )
}

export function BirdDepth() {
  return (
    <LazyVisual which="depth">
      <LayerPyramidLazy />
    </LazyVisual>
  )
}

export function BirdDecision() {
  return (
    <LazyVisual which="decision">
      <SoftmaxRaceLazy />
    </LazyVisual>
  )
}

export function BirdTransfer() {
  return (
    <LazyVisual which="transfer">
      <TransferDiagramLazy />
    </LazyVisual>
  )
}
