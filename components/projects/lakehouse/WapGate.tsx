'use client'

import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { WAP_RUNS } from '@/content/data/lakehouse'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { WAP_GATE } from './lakehouse-geometry'
import { LayoutSvg, type LayoutElementId } from './LayoutSvg'

const SVG_LABEL =
  'Two branch diagrams. In the first, a branch leaves the trunk, passes two steps and merges back into a new commit. In the second, the same branch stops at a bar after its second step and the trunk gains no commit.'

const STRUCTURE_DELAY_MS = [0, 700, 120, 2000]
const RING_DELAY_MS = [1100, 1250, 2400, 2550]
const DOT_DELAY_MS = [500, 1600, 620]
const LABEL_DELAY_MS = [500, 1100, 1250, 1450, 1700, 620, 2400, 2550, 2750, 3310]
const ACCENT_TIMING: readonly { delayMs: number; duration: string }[] = [
  { delayMs: 2950, duration: 'var(--dur-fast)' },
  { delayMs: 3070, duration: 'var(--dur-base)' },
]

const ROW_DELAY_MS = [1700, 3310]

function opacityStyle(delayMs: number, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transition: 'none' }
  return {
    opacity: entered ? 1 : 0,
    transition: 'opacity var(--dur-base) var(--ease-out)',
    transitionDelay: `${delayMs}ms`,
  }
}

/**
 * One styleFor per rendered layout, closed over that layout's own path lengths, the same split
 * IntervalJoin uses: the two scenes share delays but not dash-offset math.
 */
function makeStyleFor(
  layout: typeof WAP_GATE.wide,
  entered: boolean,
  reduced: boolean,
): (id: LayoutElementId) => CSSProperties | undefined {
  return (id) => {
    const [kind, indexPart] = id.split(':')
    const index = Number(indexPart)

    switch (kind) {
      case 'structure': {
        const length = layout.structure[index]?.length ?? 0
        if (reduced) return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
        return {
          strokeDasharray: length,
          strokeDashoffset: entered ? 0 : length,
          transition: 'stroke-dashoffset var(--dur-draw) var(--ease-out)',
          transitionDelay: `${STRUCTURE_DELAY_MS[index] ?? 0}ms`,
        }
      }
      case 'ring':
        return opacityStyle(RING_DELAY_MS[index] ?? 0, entered, reduced)
      case 'dot':
        return opacityStyle(DOT_DELAY_MS[index] ?? 0, entered, reduced)
      case 'accent': {
        const length = layout.accent[index]?.length ?? 0
        if (reduced) return { strokeDasharray: length, strokeDashoffset: 0, transition: 'none' }
        const timing = ACCENT_TIMING[index]
        return {
          strokeDasharray: length,
          strokeDashoffset: entered ? 0 : length,
          transition: `stroke-dashoffset ${timing.duration} var(--ease-out)`,
          transitionDelay: `${timing.delayMs}ms`,
        }
      }
      case 'label':
        return opacityStyle(LABEL_DELAY_MS[index] ?? 0, entered, reduced)
      default:
        return undefined
    }
  }
}

/**
 * Section figure for wap: the clean branch that merged against the bad branch that never left
 * a null key on main. Both DOM strip rows below print the same mainHash and the same row count
 * on purpose, that identical pair is the finding: the gate held, so main never moved.
 */
export function WapGate() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const wideStyleFor = makeStyleFor(WAP_GATE.wide, entered, reduced)
  const stackStyleFor = makeStyleFor(WAP_GATE.stack, entered, reduced)

  return (
    <Figure
      eyebrow="WRITE, AUDIT, PUBLISH"
      title="Two runs, one of them blocked"
      caption="The clean run merged and left main with eight rows. The bad run failed its tests at the audit stage and never attempted the merge."
      source="Two captured runs of ops/wap.py. Raw output in docs/evidence/write-audit-publish/ in the project repository."
      disclosureLabel="Show both runs"
      well={{ height: 460, heightSm: 390 }}
      table={
        <FigureTable
          caption="Both captured write-audit-publish runs and what each one left on main."
          columns={[
            { key: 'run', label: 'Run' },
            { key: 'exitCode', label: 'Exit code', align: 'right' },
            { key: 'main', label: 'main' },
            { key: 'rows', label: 'Rows on main', align: 'right' },
            { key: 'outcome', label: 'Outcome' },
          ]}
          rows={WAP_RUNS.map((run) => ({
            run: run.label,
            exitCode: String(run.exitCode),
            main: run.mainHash,
            rows: String(run.mainRows),
            outcome: run.outcome,
          }))}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col gap-2">
        <div className="mx-auto h-full min-h-0 w-full max-w-[320px] flex-1 sm:max-w-[700px]">
          <div className="hidden h-full sm:block">
            <LayoutSvg layout={WAP_GATE.wide} title={SVG_LABEL} styleFor={wideStyleFor} />
          </div>
          <div className="h-full sm:hidden">
            <LayoutSvg layout={WAP_GATE.stack} title={SVG_LABEL} styleFor={stackStyleFor} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {WAP_RUNS.map((run, index) => (
            <div
              key={run.id}
              className="flex flex-col gap-0.5 border-l-2 pl-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
              style={{
                borderColor: run.id === 'bad' ? 'var(--accent)' : 'transparent',
                ...opacityStyle(ROW_DELAY_MS[index] ?? 0, entered, reduced),
              }}
            >
              <span className="text-tick text-text-tertiary">{run.label}</span>
              <span className="text-small tabular-nums text-text-primary">
                {`exit ${run.exitCode}, main ${run.mainHash}, ${run.mainRows} rows`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Figure>
  )
}
