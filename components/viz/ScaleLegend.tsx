import clsx from 'clsx'
import { HAIRLINE_CSS } from '@/lib/viz/palette'

export interface ScaleLegendProps {
  /** Seven colours, low to high. */
  colors: readonly string[]
  /** Six ascending breakpoint labels, pre-formatted (e.g. "$525K"). */
  breakLabels: readonly string[]
  lowLabel: string
  highLabel: string
  /** Index 0..6 to emphasise, or null. Used when a borough row is focused. */
  highlightIndex?: number | null
  className?: string
}

/** Seven swatches with the six breakpoint labels between them, plus low/high end labels. */
export function ScaleLegend({ colors, breakLabels, lowLabel, highLabel, highlightIndex, className }: ScaleLegendProps) {
  const ariaLabel = `Scale from ${lowLabel} to ${highLabel}, seven steps, breakpoints at ${breakLabels.join(', ')}.`

  return (
    <div className={clsx('flex flex-col gap-1', className)} role="img" aria-label={ariaLabel}>
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {colors.map((color, index) => (
          <div
            key={color}
            className="flex-1"
            style={{
              backgroundColor: color,
              border: `0.5px solid ${HAIRLINE_CSS}`,
              outline: highlightIndex === index ? '2px solid var(--text-primary)' : undefined,
              outlineOffset: highlightIndex === index ? '-2px' : undefined,
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap justify-between gap-x-2 gap-y-1 text-tick text-text-tertiary">
        <span>{lowLabel}</span>
        {breakLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
        <span>{highLabel}</span>
      </div>
    </div>
  )
}
