import type { CSSProperties } from 'react'

/**
 * Either an aspect ratio for the figure well, or an explicit reserved height in px.
 *
 * A ratio works for a well whose content scales with its width (a canvas, a chart). It does
 * not work for a well whose content is a stack of text rows: that content's height does not
 * change with width, so no single ratio fits both a phone and a desktop viewport. Those wells
 * reserve a fixed height instead, with a narrower one for the stacked mobile layout.
 */
export type WellSize =
  | { ratio: string; ratioSm?: string }
  | { height: number; heightSm?: number }

/**
 * The only place that turns a WellSize into CSS. Figure and FigureSkeleton both call this, so
 * the loading box and the loaded box can never drift out of sync with each other.
 */
export function wellStyle(size: WellSize): CSSProperties {
  const style: Record<string, string> = {}
  if ('ratio' in size) {
    style['--well-ratio'] = size.ratio
    if (size.ratioSm) style['--well-ratio-sm'] = size.ratioSm
  } else {
    style['--well-height'] = `${size.height}px`
    if (size.heightSm) style['--well-height-sm'] = `${size.heightSm}px`
  }
  return style as CSSProperties
}
