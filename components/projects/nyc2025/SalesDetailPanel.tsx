import { BOROUGHS_2025, CLASS_LABELS } from '@/content/data/nyc-2025-sales'
import { formatCount, formatUSD } from '@/lib/format'
import { zillowSearchUrl } from './zillow-link'
import type { DetailState } from './useSalesPoints'

export interface SalesDetailPanelProps {
  /** Null when nothing is selected. The panel is always rendered, so its box is reserved. */
  sale: {
    globalIndex: number
    /** Exact recorded price, straight out of points.json. Never rounded. */
    price: number
    boroughIndex: number
    classCode: string
    /** 0..11. Printed only in the error state, where the shard's exact date is unavailable. */
    month: number
  } | null
  /** From useSaleDetail. 'idle' when nothing is selected. */
  detail: DetailState
  /** From content/data/nyc-2025-sales.ts. */
  year: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatSaleDate(year: number, day: number): string {
  const date = new Date(year, 0, 1 + day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * The persistent readout for the selected sale. Always mounted, whatever the selection state,
 * so a shard resolving from loading to ready never appends height the rest of the figure had
 * not already reserved. aria-live="polite" is this figure's one live region: the map's own
 * summary paragraph is static text for exactly that reason.
 */
export function SalesDetailPanel({ sale, detail, year }: SalesDetailPanelProps) {
  return (
    <div className="rounded-(--radius-md) border border-border-subtle bg-surface-1 p-4" aria-live="polite">
      {renderBody(sale, detail, year)}
    </div>
  )
}

function renderBody(
  sale: SalesDetailPanelProps['sale'],
  detail: DetailState,
  year: number,
) {
  if (!sale || detail.status === 'idle') {
    return (
      <p className="text-small text-text-secondary">
        Select a dot on the map, or a row in the table, to see one sale.
      </p>
    )
  }

  if (detail.status === 'loading') {
    return <p className="text-small text-text-secondary">Loading the address for this sale.</p>
  }

  if (detail.status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-small text-text-primary">Could not load the address for this sale.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-small">
          <Row label="Borough" value={BOROUGHS_2025[sale.boroughIndex].name} />
          <Row label="Building type" value={CLASS_LABELS[sale.classCode]} />
          <Row label="Month" value={MONTH_NAMES[sale.month]} />
        </dl>
      </div>
    )
  }

  const readout = detail.detail
  const zillowUrl = zillowSearchUrl(readout.address, readout.zip)

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-body text-text-primary">
          {readout.address}
          {readout.apartment ? `, ${readout.apartment}` : ''}
        </p>
        <p className="text-small text-text-secondary">
          {readout.neighborhood}, {BOROUGHS_2025[sale.boroughIndex].name}
        </p>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-small">
        <Row label="Sale price" value={formatUSD(sale.price)} />
        <Row label="Sale date" value={formatSaleDate(year, readout.day)} />
        <Row label="Building type" value={CLASS_LABELS[sale.classCode]} />
        <Row
          label="Gross square feet"
          value={readout.grossSqFt === 0 ? 'not recorded' : `${formatCount(readout.grossSqFt)} sq ft`}
        />
        <Row label="Year built" value={readout.yearBuilt === 0 ? 'not recorded' : String(readout.yearBuilt)} />
      </dl>
      {zillowUrl && (
        <a
          href={zillowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-small text-accent hover:text-accent-hover"
        >
          Look up this address on Zillow
          <span className="sr-only"> (opens a Zillow search in a new tab)</span>
        </a>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="text-text-primary">{value}</dd>
    </>
  )
}
