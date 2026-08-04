'use client'

import clsx from 'clsx'
import { useRovingRadioGroup } from '@/lib/roving-radio'
import type { StatsWindow } from '@/lib/analytics/stats-types'

export interface WindowControlProps {
  value: StatsWindow
  onChange: (next: StatsWindow) => void
  disabled?: boolean
}

const OPTIONS: readonly { value: StatsWindow; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
]

/**
 * The dashboard's one control. Selection carries both a background change and a check mark, so
 * which window is active is never conveyed by color alone.
 */
export function WindowControl({ value, onChange, disabled }: WindowControlProps) {
  const { groupProps, getRadioProps } = useRovingRadioGroup(
    OPTIONS.map((option) => option.value),
    value,
    onChange,
  )

  return (
    <div
      role="radiogroup"
      aria-label="Time window"
      className="flex gap-1"
      {...groupProps}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            {...getRadioProps(option.value)}
            className={clsx(
              'flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-small transition-colors duration-(--dur-fast)',
              selected
                ? 'border-text-primary bg-text-primary text-surface-0'
                : 'border-border-strong bg-surface-1 text-text-secondary hover:bg-surface-2',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {selected && <span aria-hidden="true">&#10003;</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
