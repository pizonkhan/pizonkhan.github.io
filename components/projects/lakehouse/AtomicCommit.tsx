'use client'

import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { BILLING_BASELINE, CHECKSUM_PROOFS } from '@/content/data/lakehouse'
import { ATOMIC_COMMIT, type FigureLayout } from './lakehouse-geometry'
import { LayoutSvg, type LayoutElementId } from './LayoutSvg'

type LabelKey = 'merge' | 'minio' | 'committed' | 'sigkill' | 'file' | 'unchanged'

interface Timing {
  delayMs: number
  duration: string
  easing: string
}

/**
 * structure indices are identical between ATOMIC_COMMIT.wide and .stack (rail1, rail2, bar1,
 * committed, cap1, cap2, file, in that order), so one timing table serves both layouts. Index 2
 * is the MERGE bar: 1400ms is not one of the app/globals.css duration tokens because none of
 * them match the 900 to 2300ms window the kill lands on, and --ease-linear is deliberate, the
 * only element on the page that isn't eased.
 */
const STRUCTURE_TIMING: readonly Timing[] = [
  { delayMs: 0, duration: 'var(--dur-draw)', easing: 'var(--ease-out)' },
  { delayMs: 120, duration: 'var(--dur-draw)', easing: 'var(--ease-out)' },
  { delayMs: 900, duration: '1400ms', easing: 'var(--ease-linear)' },
  { delayMs: 240, duration: 'var(--dur-draw)', easing: 'var(--ease-out)' },
  { delayMs: 900, duration: 'var(--dur-fast)', easing: 'var(--ease-out)' },
  { delayMs: 960, duration: 'var(--dur-fast)', easing: 'var(--ease-out)' },
  { delayMs: 1200, duration: 'var(--dur-base)', easing: 'var(--ease-out)' },
]

const ACCENT_TIMING: Timing = { delayMs: 2300, duration: 'var(--dur-fast)', easing: 'var(--ease-out)' }
const DASHED_TIMING: Timing = { delayMs: 2500, duration: 'var(--dur-base)', easing: 'var(--ease-out)' }

const LABEL_TIMING: Record<LabelKey, Timing> = {
  merge: { delayMs: 300, duration: 'var(--dur-base)', easing: 'var(--ease-out)' },
  minio: { delayMs: 380, duration: 'var(--dur-base)', easing: 'var(--ease-out)' },
  committed: { delayMs: 460, duration: 'var(--dur-base)', easing: 'var(--ease-out)' },
  sigkill: { delayMs: 2380, duration: 'var(--dur-fast)', easing: 'var(--ease-out)' },
  file: { delayMs: 1450, duration: 'var(--dur-base)', easing: 'var(--ease-out)' },
  unchanged: { delayMs: 2700, duration: 'var(--dur-base)', easing: 'var(--ease-out)' },
}

const ROW1_TIMING: Timing = { delayMs: 700, duration: 'var(--dur-base)', easing: 'var(--ease-out)' }
const ROW2_TIMING: Timing = { delayMs: 2700, duration: 'var(--dur-base)', easing: 'var(--ease-out)' }

// Label order differs between the two layouts: wide reads MERGE, MinIO, committed, SIGKILL,
// file, unchanged; the stacked layout puts SIGKILL right under MERGE and splits the unchanged
// line across two <text> elements.
const WIDE_LABEL_KEYS: readonly LabelKey[] = ['merge', 'minio', 'committed', 'sigkill', 'file', 'unchanged']
const STACK_LABEL_KEYS: readonly LabelKey[] = [
  'merge',
  'sigkill',
  'minio',
  'file',
  'committed',
  'unchanged',
  'unchanged',
]

const SVG_TITLE =
  'Three lanes. A progress bar stops partway at a marked bar, a file shape sits below it, and a third line runs the full width uninterrupted with a cap at each end.'

const TABLE_ROWS = CHECKSUM_PROOFS.map((proof) => ({
  table: proof.table,
  rows: proof.rows,
  checksum: proof.checksum,
  check: proof.note,
}))

function drawStyle(length: number, timing: Timing, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
  return {
    strokeDasharray: length,
    strokeDashoffset: entered ? 0 : length,
    transition: `stroke-dashoffset ${timing.duration} ${timing.easing}`,
    transitionDelay: `${timing.delayMs}ms`,
  }
}

function fadeStyle(timing: Timing, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transition: 'none' }
  return {
    opacity: entered ? 1 : 0,
    transition: `opacity ${timing.duration} ${timing.easing}`,
    transitionDelay: `${timing.delayMs}ms`,
  }
}

function makeStyleFor(
  layout: FigureLayout,
  labelKeys: readonly LabelKey[],
  entered: boolean,
  reduced: boolean,
): (id: LayoutElementId) => CSSProperties | undefined {
  return (id) => {
    const [kind, indexText] = id.split(':')
    const index = Number(indexText)
    if (kind === 'structure') return drawStyle(layout.structure[index].length, STRUCTURE_TIMING[index], entered, reduced)
    if (kind === 'accent') return drawStyle(layout.accent[index].length, ACCENT_TIMING, entered, reduced)
    if (kind === 'dashed') return fadeStyle(DASHED_TIMING, entered, reduced)
    if (kind === 'label') return fadeStyle(LABEL_TIMING[labelKeys[index]], entered, reduced)
    return undefined
  }
}

/**
 * Section figure for `atomicity`. Three lanes: the MERGE bar reaches 900 to 2300ms on linear
 * easing, since that is the one rate the source repository never measured and an eased fill
 * would imply one. The kill lands the instant the bar stops. Both DOM strip rows print the same
 * BILLING_BASELINE values, because the finding is that nothing changed.
 */
export function AtomicCommit() {
  const reduced = usePrefersReducedMotion()
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const entered = reduced || hasEntered

  const wideStyleFor = makeStyleFor(ATOMIC_COMMIT.wide, WIDE_LABEL_KEYS, entered, reduced)
  const stackStyleFor = makeStyleFor(ATOMIC_COMMIT.stack, STACK_LABEL_KEYS, entered, reduced)

  return (
    <Figure
      eyebrow="ATOMIC COMMIT"
      title="A write killed on purpose"
      caption="A live MERGE was killed after a real Parquet file had already landed in the object store. The committed table did not move."
      source="Idempotency checks from docs/07-operations.md incident 2, docs/03-theory/07-merge-semantics-idempotency.md and README.md in the project repository. Checksums exclude loaded_at, which is wall-clock audit metadata."
      well={{ height: 430, heightSm: 360 }}
      disclosureLabel="Show the numbers"
      table={
        <FigureTable
          caption="Idempotency checks across four tables, including the one that was killed mid-write."
          columns={[
            { key: 'table', label: 'Table' },
            { key: 'rows', label: 'Rows', align: 'right' },
            { key: 'checksum', label: 'Checksum' },
            { key: 'check', label: 'Check' },
          ]}
          rows={TABLE_ROWS}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-2">
        <div className="mx-auto h-full min-h-0 w-full max-w-[320px] flex-1 sm:max-w-[700px]">
          <LayoutSvg
            layout={ATOMIC_COMMIT.wide}
            title={SVG_TITLE}
            styleFor={wideStyleFor}
            className="hidden sm:block"
          />
          <LayoutSvg layout={ATOMIC_COMMIT.stack} title={SVG_TITLE} styleFor={stackStyleFor} className="sm:hidden" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3" style={fadeStyle(ROW1_TIMING, entered, reduced)}>
            <span className="text-tick text-text-tertiary">before the kill</span>
            <span className="text-small tabular-nums text-text-primary">
              {BILLING_BASELINE.rows} rows, <span className="font-mono text-tick">{BILLING_BASELINE.checksum}</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3" style={fadeStyle(ROW2_TIMING, entered, reduced)}>
            <span className="text-tick text-text-tertiary">after the kill</span>
            <span className="text-small tabular-nums text-text-primary">
              {BILLING_BASELINE.rows} rows, <span className="font-mono text-tick">{BILLING_BASELINE.checksum}</span>
            </span>
          </div>
        </div>
      </div>
    </Figure>
  )
}
