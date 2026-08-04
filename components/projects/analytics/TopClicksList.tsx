'use client'

import { Figure } from '@/components/viz/Figure'
import { Pill } from '@/components/ui/Pill'
import { EmptyWell } from './EmptyWell'
import { formatCount } from '@/lib/format'
import type { ClickRow } from '@/lib/analytics/stats-types'

export interface TopClicksListProps {
  clicks: ClickRow[]
}

const TARGET_LABEL: Record<string, string> = {
  internal: 'internal',
  outbound: 'outbound',
  anchor: 'anchor',
  mailto: 'mailto',
  download: 'download',
}

/**
 * An ordered list, not a chart: every number is already printed as text, so Figure's table
 * disclosure would just repeat what is on screen rather than offer an equivalent. No table prop
 * is the documented exception, not an omission.
 */
export function TopClicksList({ clicks }: TopClicksListProps) {
  return (
    <Figure
      eyebrow="MOST CLICKED"
      title="Links and sections people actually click"
      caption="Top 10 clicked targets this window, most clicks first."
      source="This site's own event table, read live from the analytics worker."
      well={{ height: 380, heightSm: 460 }}
    >
      {clicks.length === 0 ? (
        <EmptyWell kind="empty" message="No clicks recorded in this window yet." />
      ) : (
        <ol className="flex h-full flex-col justify-start gap-3 overflow-y-auto py-1">
          {clicks.map((click, index) => (
            <li key={`${click.path}-${click.section}-${click.targetKind}-${click.href}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="w-5 flex-shrink-0 text-tick tabular-nums text-text-tertiary">{index + 1}</span>
              <span className="min-w-0 flex-1 basis-40 truncate text-small text-text-primary" title={click.label || click.href}>
                {click.label || click.href}
              </span>
              <Pill className="flex-shrink-0">{click.section}</Pill>
              <Pill tone="muted" className="flex-shrink-0">{TARGET_LABEL[click.targetKind] ?? click.targetKind}</Pill>
              <span className="min-w-0 basis-full truncate text-tick text-text-tertiary sm:basis-auto sm:flex-1" title={click.href}>
                {click.href}
              </span>
              <span className="flex-shrink-0 text-tick tabular-nums text-text-secondary">{formatCount(click.clicks)}</span>
            </li>
          ))}
        </ol>
      )}
    </Figure>
  )
}
