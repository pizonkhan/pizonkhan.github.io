'use client'

import { Figure } from '@/components/viz/Figure'
import { FigureTable } from '@/components/viz/FigureTable'
import { EmptyWell } from './EmptyWell'
import { useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'
import { formatCount } from '@/lib/format'
import type { DeviceRow, NamedRow } from '@/lib/analytics/stats-types'

export interface AudienceBreakdownProps {
  devices: DeviceRow[]
  referrers: NamedRow[]
  countries: NamedRow[]
}

let regionNames: Intl.DisplayNames | undefined

function countryLabel(code: string): string {
  if (code === 'XX') return 'Unknown'
  try {
    regionNames ??= new Intl.DisplayNames(['en'], { type: 'region' })
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

interface Row {
  key: string
  label: string
  views: number
}

function MiniList({ title, rows, entered, reduced }: { title: string; rows: Row[]; entered: boolean; reduced: boolean }) {
  const max = Math.max(1, ...rows.map((row) => row.views))
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-label text-text-tertiary">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-tick text-text-tertiary">No data in this window yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row, index) => {
            const widthPct = (row.views / max) * 100
            const delay = `${index * 40}ms`
            return (
              <li key={row.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-tick">
                  <span className="min-w-0 truncate text-text-primary">{row.label}</span>
                  <span className="flex-shrink-0 tabular-nums text-text-tertiary">{formatCount(row.views)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-1">
                  <div
                    className="h-full origin-left rounded-full"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: 'var(--text-tertiary)',
                      transform: `scaleX(${entered ? 1 : 0})`,
                      transition: reduced ? 'none' : `transform 900ms var(--ease-out) ${delay}`,
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Three ranked mini-lists: device and browser, referrer host, country. */
export function AudienceBreakdown({ devices, referrers, countries }: AudienceBreakdownProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLDivElement>({ rootMargin: '200px', threshold: 0 })
  const reduced = usePrefersReducedMotion()
  const entered = reduced || hasEntered

  const deviceRows: Row[] = devices.map((d) => ({
    key: `${d.device}-${d.browser}`,
    label: `${d.device} · ${d.browser}`,
    views: d.views,
  }))
  const referrerRows: Row[] = referrers.map((r) => ({ key: r.name, label: r.name, views: r.views }))
  const countryRows: Row[] = countries.map((c) => ({ key: c.name, label: countryLabel(c.name), views: c.views }))

  const empty = deviceRows.length === 0 && referrerRows.length === 0 && countryRows.length === 0

  const tableRows = [
    ...deviceRows.map((row) => ({ dimension: 'Device / browser', value: row.label, views: formatCount(row.views) })),
    ...referrerRows.map((row) => ({ dimension: 'Referrer', value: row.label, views: formatCount(row.views) })),
    ...countryRows.map((row) => ({ dimension: 'Country', value: row.label, views: formatCount(row.views) })),
  ]

  return (
    <Figure
      eyebrow="WHO'S READING"
      title="Device, referrer and country"
      caption="Ranked by page views, this window."
      source="This site's own event table, read live from the analytics worker. Device and browser are inferred from the request, never a stored user agent."
      well={{ height: 320, heightSm: 460 }}
      table={
        <FigureTable
          caption="Every device, referrer and country row behind the three lists."
          columns={[
            { key: 'dimension', label: 'Dimension' },
            { key: 'value', label: 'Value' },
            { key: 'views', label: 'Page views', align: 'right' },
          ]}
          rows={tableRows}
        />
      }
    >
      {empty ? (
        <EmptyWell kind="empty" message="No page views in this window yet." />
      ) : (
        <div ref={ref} className="grid h-full grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-3">
          <MiniList title="Device / browser" rows={deviceRows} entered={entered} reduced={reduced} />
          <MiniList title="Referrer" rows={referrerRows} entered={entered} reduced={reduced} />
          <MiniList title="Country" rows={countryRows} entered={entered} reduced={reduced} />
        </div>
      )}
    </Figure>
  )
}
