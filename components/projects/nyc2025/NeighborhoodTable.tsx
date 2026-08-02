'use client'

import { useId, useMemo, useState } from 'react'
import clsx from 'clsx'
import { formatCount, formatUSD } from '@/lib/format'
import { BOROUGHS_2025 } from '@/content/data/nyc-2025-sales'
import type { NeighborhoodStat } from '@/content/data/nyc-2025-neighborhoods'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import type { PropertyGroup } from './SalesMap'

export interface NeighborhoodTableProps {
  /** From content/data/nyc-2025-neighborhoods.ts, pre-sorted by median descending. */
  rows: readonly NeighborhoodStat[]
  /** Applied by the parent so the table always describes what the map is showing. */
  group: PropertyGroup
  month: number | null
  /** neighborhoodKey(row), never a bare name. Null when nothing is focused. */
  focus: string | null
  onFocus: (key: string | null) => void
  /**
   * Flies the map to that neighbourhood's centroid AND selects the sale nearest that centroid,
   * which is the only keyboard path to the detail panel. See the note under this block.
   */
  onSelect: (row: NeighborhoodStat) => void
}

/**
 * Row identity, exported from this module and imported by SalesMap so the table and the map's
 * centroid ring can never disagree about which row is focused.
 *
 * A bare name is not unique. The 2026-08-01 snapshot has SUNNYSIDE in Queens and SUNNYSIDE in
 * Staten Island, both above the four-sale floor, with different medians and centroids 30 km
 * apart. The generator groups by (borough, name), so that pair is unique by construction and
 * this key is total.
 */
export function neighborhoodKey(row: NeighborhoodStat): string {
  return `${row.b}:${row.name}`
}

type SortKey = 'name' | 'borough' | 'sales' | 'median' | 'perSqFt'
type SortDir = 'asc' | 'desc'

const COLUMNS: readonly { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'name', label: 'Neighbourhood' },
  { key: 'borough', label: 'Borough' },
  { key: 'sales', label: 'Sales', align: 'right' },
  { key: 'median', label: 'Median', align: 'right' },
  { key: 'perSqFt', label: 'Median $ / sq ft', align: 'right' },
]

const SORT_KEYS = COLUMNS.map((column) => column.key)

const PAGE_SIZE = 25

const GROUP_LABEL: Record<PropertyGroup, string> = {
  all: 'every property type',
  houses: 'houses',
  condos: 'condos',
  coops: 'co-ops',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function compareRows(a: NeighborhoodStat, b: NeighborhoodStat, key: SortKey, dir: SortDir): number {
  const sign = dir === 'asc' ? 1 : -1

  if (key === 'perSqFt') {
    // Null always sorts last, in both directions: a missing figure never reads as a low one.
    if (a.perSqFt === null && b.perSqFt === null) return 0
    if (a.perSqFt === null) return 1
    if (b.perSqFt === null) return -1
    return (a.perSqFt - b.perSqFt) * sign
  }
  if (key === 'name') return a.name.localeCompare(b.name) * sign
  if (key === 'borough') {
    const nameA = BOROUGHS_2025[a.b].name
    const nameB = BOROUGHS_2025[b.b].name
    return (nameA.localeCompare(nameB) || a.name.localeCompare(b.name)) * sign
  }
  if (key === 'sales') return (a.n - b.n) * sign
  return (a.median - b.median) * sign
}

/**
 * The map's non-visual equivalent and the keyboard path to everything the map encodes. Not a
 * transcription of 44,784 dots, which would be unusable: the same data aggregated to the 245
 * borough-and-neighbourhood rows the Department of Finance itself names, the level at which the
 * map's colour is actually readable.
 */
export function NeighborhoodTable({ rows, group, month, focus, onFocus, onSelect }: NeighborhoodTableProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('median')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [showAll, setShowAll] = useState(false)
  const searchId = useId()

  const { groupProps, getRadioProps } = useRovingRadioGroup(SORT_KEYS, sortKey, (next) => {
    setSortDir(next === sortKey ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(next)
  })

  const filteredSorted = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle.length === 0 ? [...rows] : rows.filter((row) => row.name.toLowerCase().includes(needle))
    return filtered.sort((a, b) => compareRows(a, b, sortKey, sortDir))
  }, [rows, query, sortKey, sortDir])

  const visible = showAll ? filteredSorted : filteredSorted.slice(0, PAGE_SIZE)

  const contextLine =
    `The map above is currently showing ${GROUP_LABEL[group]}${month === null ? '' : `, ${MONTH_NAMES[month]} only`}. `
    + 'The table below is not filtered: it covers every neighbourhood with at least four sales in '
    + 'the snapshot, so its counts do not change with that filter.'

  return (
    <div className="flex flex-col gap-3">
      <p className="text-tick text-text-tertiary">{contextLine}</p>

      <label className="flex max-w-xs flex-col gap-1 text-small text-text-secondary" htmlFor={searchId}>
        Filter neighbourhoods
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Park Slope"
          className="rounded-(--radius-sm) border border-border-strong bg-surface-1 px-2 py-1.5 text-small text-text-primary"
        />
      </label>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-small">
          <caption className="sr-only">
            245 New York City neighbourhoods, 2025 recorded home sales, sortable by every column.
          </caption>
          <thead>
            <tr {...groupProps} className="text-tick text-text-tertiary">
              {COLUMNS.map((column) => {
                const { ref, tabIndex, onClick } = getRadioProps(column.key)
                const active = column.key === sortKey
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={clsx(
                      'border-b border-border-subtle py-1.5 font-normal',
                      column.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    <button
                      type="button"
                      ref={ref}
                      tabIndex={tabIndex}
                      onClick={onClick}
                      className={clsx(
                        'inline-flex items-center gap-1 hover:text-text-primary',
                        active && 'text-text-primary',
                      )}
                    >
                      {column.label}
                      {active && <span aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const key = neighborhoodKey(row)
              const selected = focus === key
              return (
                <tr
                  key={key}
                  tabIndex={0}
                  aria-selected={selected}
                  onMouseEnter={() => onFocus(key)}
                  onMouseLeave={() => onFocus(null)}
                  onFocus={() => onFocus(key)}
                  onBlur={() => onFocus(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(row)
                    }
                  }}
                  className={clsx(
                    'cursor-default border-b border-border-subtle transition-colors duration-(--dur-fast)',
                    selected ? 'bg-accent-wash' : 'hover:bg-surface-1',
                  )}
                >
                  <td className="px-2 py-2 text-body text-text-primary">{row.name}</td>
                  <td className={clsx('px-2 py-2', selected ? 'text-text-secondary' : 'text-text-tertiary')}>
                    {BOROUGHS_2025[row.b].name}
                  </td>
                  <td
                    className={clsx(
                      'px-2 py-2 text-right tabular-nums',
                      selected ? 'text-text-secondary' : 'text-text-tertiary',
                    )}
                  >
                    {formatCount(row.n)}
                  </td>
                  <td
                    className={clsx(
                      'px-2 py-2 text-right tabular-nums',
                      selected ? 'text-text-secondary' : 'text-text-primary',
                    )}
                  >
                    {formatUSD(row.median)}
                  </td>
                  <td
                    className={clsx(
                      'px-2 py-2 text-right tabular-nums',
                      selected ? 'text-text-secondary' : 'text-text-tertiary',
                    )}
                  >
                    {row.perSqFt === null ? (
                      'not recorded'
                    ) : (
                      <>
                        {formatUSD(row.perSqFt)}
                        <div className={clsx('text-tick', selected ? 'text-text-secondary' : 'text-text-tertiary')}>
                          {formatCount(row.perSqFtRows ?? 0)} sales
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredSorted.length > PAGE_SIZE && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="self-start text-small text-accent hover:text-accent-hover"
        >
          {showAll ? 'Show fewer neighbourhoods' : `Show all ${filteredSorted.length} neighbourhoods`}
        </button>
      )}
    </div>
  )
}
