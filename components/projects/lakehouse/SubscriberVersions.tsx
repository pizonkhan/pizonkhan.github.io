'use client'

import type { CSSProperties } from 'react'
import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { SCD_SUBSCRIBER_ID, SCD_VERSIONS } from '@/content/data/lakehouse'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'

const FIGURE_SOURCE =
  'Spot check against the built table. Five versions and previous_plan_tier from README.md; ' +
  'the plan tiers, standard to premium at version 2, from docs/08-interview-notes.md. Version 1 ' +
  'carries no prior plan tier because it has no earlier plan segment; the repository reports ' +
  'versions 2 through 5.'

const TABLE_COLUMNS = [
  { key: 'version', label: 'Version' },
  { key: 'changed', label: 'Changed' },
  { key: 'planTier', label: 'plan_tier' },
  { key: 'currentPlanTier', label: 'current_plan_tier' },
  { key: 'previousPlanTier', label: 'previous_plan_tier' },
]

function gridPos(column: number, row: number | string): CSSProperties {
  return { gridColumn: column, gridRow: row }
}

function headerStyle(entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1 }
  return {
    opacity: entered ? 1 : 0,
    transition: 'opacity var(--dur-base) var(--ease-out)',
  }
}

function rowStyle(index: number, entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? 'none' : 'translateY(6px)',
    transition: 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
    transitionDelay: `${index * 120}ms`,
  }
}

function badgeStyle(entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1 }
  return {
    opacity: entered ? 1 : 0,
    transition: 'opacity var(--dur-base) var(--ease-out)',
    transitionDelay: '700ms',
  }
}

function accentStyle(entered: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { transform: 'scaleY(1)' }
  return {
    transformOrigin: 'top',
    transform: entered ? 'scaleY(1)' : 'scaleY(0)',
    transition: 'transform var(--dur-slow) var(--ease-out)',
    transitionDelay: '900ms',
  }
}

function TypeBadge({ entered, reduced, children }: { entered: boolean; reduced: boolean; children: string }) {
  return (
    <span
      className="inline-flex w-fit items-center rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 text-tick text-text-secondary"
      style={badgeStyle(entered, reduced)}
    >
      {children}
    </span>
  )
}

function AccentBar({ entered, reduced }: { entered: boolean; reduced: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0 h-full w-0.5"
      style={{ backgroundColor: 'var(--accent)', ...accentStyle(entered, reduced) }}
    />
  )
}

/**
 * Section figure for `scd`. DOM only, two layouts.
 *
 * The desktop grid places every cell on an explicit gridColumn/gridRow rather than relying on
 * auto-flow, because the accent bar for previous_plan_tier is one element spanning rows 2 through
 * 5 (versions 2 to 5): if that bar were left to auto-place, the grid's occupied-cell tracking
 * would treat its span as claimed and push every later auto-placed cell in that column out of
 * position. Explicit placement lets the bar and the version 2 to 5 text cells occupy the same
 * cells on purpose, which is exactly the visual (a rule the text sits next to, not inside).
 */
export function SubscriberVersions() {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>()
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const tableRows = SCD_VERSIONS.map((version) => ({
    version: `v${version.version}`,
    changed: version.changed,
    planTier: version.planTier,
    currentPlanTier: version.currentPlanTier,
    previousPlanTier: version.previousPlanTier,
  }))

  return (
    <Figure
      eyebrow="TYPE 6 HYBRID"
      title="Five versions of one subscriber"
      caption={`Subscriber ${SCD_SUBSCRIBER_ID} from the built dim_subscriber. A real plan change opens version 2, then three status-only versions follow, and previous_plan_tier holds standard across all four.`}
      source={FIGURE_SOURCE}
      well={{ height: 680, heightSm: 380 }}
      disclosureLabel="Show the versions"
      table={
        <FigureTable
          caption={`Five versions of subscriber ${SCD_SUBSCRIBER_ID}, and what each SCD-typed column reads on each.`}
          columns={TABLE_COLUMNS}
          rows={tableRows}
        />
      }
    >
      <div ref={ref} className="flex h-full flex-col justify-center gap-6">
        <div className="hidden sm:grid sm:grid-cols-[3rem_1fr_1fr_1fr_1fr] sm:gap-x-3 sm:gap-y-1">
          <div style={{ ...gridPos(1, 1), ...headerStyle(entered, reduced) }} className="text-tick text-text-tertiary">
            version
          </div>
          <div style={{ ...gridPos(2, 1), ...headerStyle(entered, reduced) }} className="text-tick text-text-tertiary">
            changed
          </div>
          <div style={{ ...gridPos(3, 1), ...headerStyle(entered, reduced) }} className="flex flex-col gap-1">
            <span className="text-tick text-text-tertiary">plan_tier</span>
            <TypeBadge entered={entered} reduced={reduced}>
              Type 2 tracked
            </TypeBadge>
          </div>
          <div style={{ ...gridPos(4, 1), ...headerStyle(entered, reduced) }} className="flex flex-col gap-1">
            <span className="text-tick text-text-tertiary">current_plan_tier</span>
            <TypeBadge entered={entered} reduced={reduced}>
              Type 1 mirror
            </TypeBadge>
          </div>
          <div style={{ ...gridPos(5, 1), ...headerStyle(entered, reduced) }} className="flex flex-col gap-1">
            <span className="text-tick text-text-tertiary">previous_plan_tier</span>
            <TypeBadge entered={entered} reduced={reduced}>
              Type 3 prior value
            </TypeBadge>
          </div>

          {SCD_VERSIONS.flatMap((version, index) => {
            const row = index + 2
            return [
              <div
                key={`v${version.version}-version`}
                style={{ ...gridPos(1, row), ...rowStyle(index, entered, reduced) }}
                className="text-small tabular-nums text-text-primary"
              >
                {`v${version.version}`}
              </div>,
              <div
                key={`v${version.version}-changed`}
                style={{ ...gridPos(2, row), ...rowStyle(index, entered, reduced) }}
                className="text-small text-text-secondary"
              >
                {version.changed}
              </div>,
              <div
                key={`v${version.version}-plan-tier`}
                style={{ ...gridPos(3, row), ...rowStyle(index, entered, reduced) }}
                className="text-small tabular-nums text-text-primary"
              >
                {version.planTier}
              </div>,
              <div
                key={`v${version.version}-current-plan-tier`}
                style={{ ...gridPos(4, row), ...rowStyle(index, entered, reduced) }}
                className="text-small tabular-nums text-text-primary"
              >
                {version.currentPlanTier}
              </div>,
              <div
                key={`v${version.version}-previous-plan-tier`}
                style={{ ...gridPos(5, row), ...rowStyle(index, entered, reduced) }}
                className="pl-2 text-small tabular-nums text-text-primary"
              >
                {version.previousPlanTier}
              </div>,
            ]
          })}

          <div style={gridPos(5, '3 / 7')} className="relative">
            <AccentBar entered={entered} reduced={reduced} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:hidden">
          {SCD_VERSIONS.map((version, index) => (
            <div
              key={version.version}
              style={rowStyle(index, entered, reduced)}
              className="rounded-md border border-border-subtle bg-surface-1 p-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-small font-medium text-text-primary">{`v${version.version}`}</span>
                <span className="text-tick text-text-tertiary">{version.changed}</span>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-tick text-text-tertiary">plan_tier</span>
                  <span className="text-small tabular-nums text-text-primary">{version.planTier}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-tick text-text-tertiary">current_plan_tier</span>
                  <span className="text-small tabular-nums text-text-primary">{version.currentPlanTier}</span>
                </div>
                <div className="relative flex items-baseline justify-between gap-3 border-l-2 border-transparent pl-2">
                  {version.version > 1 && <AccentBar entered={entered} reduced={reduced} />}
                  <span className="text-tick text-text-tertiary">previous_plan_tier</span>
                  <span className="text-small tabular-nums text-text-primary">{version.previousPlanTier}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Figure>
  )
}
