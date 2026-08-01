/**
 * Every currency, percentage and count on the site goes through here rather than a
 * one-off `toLocaleString` at the call site, so formatting stays consistent and tabular.
 * Pair the output with `font-variant-numeric: tabular-nums` (set globally on numeral
 * contexts in globals.css) so figures never jitter as digits change width.
 */

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const usdCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const countFormatter = new Intl.NumberFormat('en-US')

/** e.g. 1870000 -> "$1,870,000" */
export function formatUSD(value: number): string {
  return usdFormatter.format(value)
}

/** e.g. 1500000 -> "$1.5M" */
export function formatCompactUSD(value: number): string {
  return usdCompactFormatter.format(value)
}

/**
 * e.g. 0.723 -> "72.3%" (fraction in) or, with `alreadyPercent: true`, 72.3 -> "72.3%".
 */
export function formatPercent(value: number, options?: { digits?: number; alreadyPercent?: boolean }): string {
  const digits = options?.digits ?? 1
  const percent = options?.alreadyPercent ? value : value * 100
  return `${percent.toFixed(digits)}%`
}

/** e.g. 59350 -> "59,350" */
export function formatCount(value: number): string {
  return countFormatter.format(value)
}
