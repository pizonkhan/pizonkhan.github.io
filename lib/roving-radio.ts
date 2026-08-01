'use client'

import { useCallback, useRef } from 'react'
import type { KeyboardEvent } from 'react'

/**
 * The one implementation of the WAI-ARIA radio-group keyboard contract on this site: arrow
 * keys move both the selection and DOM focus together, so a screen-reader user hears the
 * newly selected option rather than hearing their focused option become unchecked, and a
 * sighted keyboard user sees the focus ring follow the selection.
 *
 * ArrowRight/ArrowDown move to the next value and wrap; ArrowLeft/ArrowUp move to the
 * previous and wrap; Home/End jump to the first/last. Any other key is left alone.
 */
export function useRovingRadioGroup<T extends string>(
  values: readonly T[],
  value: T,
  onChange: (next: T) => void,
) {
  const nodes = useRef(new Map<T, HTMLButtonElement>())

  const select = useCallback(
    (next: T) => {
      onChange(next)
      nodes.current.get(next)?.focus()
    },
    [onChange],
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const index = values.indexOf(value)
      if (index === -1) return

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          select(values[(index + 1) % values.length])
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          select(values[(index - 1 + values.length) % values.length])
          break
        case 'Home':
          event.preventDefault()
          select(values[0])
          break
        case 'End':
          event.preventDefault()
          select(values[values.length - 1])
          break
        default:
          break
      }
    },
    [values, value, select],
  )

  const getRadioProps = useCallback(
    (option: T) => ({
      ref: (node: HTMLButtonElement | null) => {
        if (node) nodes.current.set(option, node)
        else nodes.current.delete(option)
      },
      role: 'radio' as const,
      'aria-checked': option === value,
      tabIndex: (option === value ? 0 : -1) as 0 | -1,
      onClick: () => onChange(option),
    }),
    [value, onChange],
  )

  return { groupProps: { onKeyDown }, getRadioProps }
}
