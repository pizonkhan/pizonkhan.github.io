'use client'

import clsx from 'clsx'
import { formatCount, formatUSD } from '@/lib/format'
import type { BoroughStat } from '@/content/data/nyc-boroughs'
import type { BoroughName, SurfaceView } from './PriceSurface'

export interface BoroughTableProps {
  boroughs: readonly BoroughStat[]
  view: SurfaceView
  focus: BoroughName | null
  onFocus: (b: BoroughName | null) => void
}

/**
 * Five rows, each a button, ordered by median price high to low. This is the keyboard path to
 * every piece of information the map encodes by colour: focusing a row is exactly what hovering
 * a cell on the canvas does, minus the pointer.
 */
export function BoroughTable({ boroughs, view, focus, onFocus }: BoroughTableProps) {
  const ordered = [...boroughs].sort((a, b) => b.median - a.median)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-small">
        <caption className="sr-only">Borough summary, linked to the map above</caption>
        <thead>
          <tr className="text-tick text-text-tertiary">
            <th scope="col" className="border-b border-border-subtle py-1.5 text-left font-normal">
              Borough
            </th>
            <th scope="col" className="border-b border-border-subtle py-1.5 text-right font-normal">
              Listings
            </th>
            <th scope="col" className="border-b border-border-subtle py-1.5 text-right font-normal">
              Median
            </th>
            <th scope="col" className="border-b border-border-subtle py-1.5 text-right font-normal">
              {view === 'perSqft' ? '$ / sqft' : 'P25 to P75'}
            </th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((borough) => {
            const selected = focus === borough.name
            return (
              <tr
                key={borough.name}
                tabIndex={0}
                aria-selected={selected}
                onMouseEnter={() => onFocus(borough.name as BoroughName)}
                onMouseLeave={() => onFocus(null)}
                onFocus={() => onFocus(borough.name as BoroughName)}
                onBlur={() => onFocus(null)}
                className={clsx(
                  'cursor-default border-b border-border-subtle transition-colors duration-(--dur-fast)',
                  selected ? 'bg-accent-wash' : 'hover:bg-surface-1',
                )}
              >
                <td className="px-2 py-2 text-body text-text-primary">{borough.name}</td>
                <td
                  className={clsx(
                    'px-2 py-2 text-right tabular-nums',
                    selected ? 'text-text-secondary' : 'text-text-tertiary',
                  )}
                >
                  {formatCount(borough.n)}
                </td>
                <td
                  className={clsx(
                    'px-2 py-2 text-right tabular-nums',
                    selected ? 'text-text-secondary' : 'text-text-primary',
                  )}
                >
                  {formatUSD(borough.median)}
                </td>
                <td
                  className={clsx(
                    'px-2 py-2 text-right tabular-nums',
                    selected ? 'text-text-secondary' : 'text-text-tertiary',
                  )}
                >
                  {view === 'perSqft' ? `$${borough.medianPerSqft}` : `${formatUSD(borough.p25)}–${formatUSD(borough.p75)}`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
