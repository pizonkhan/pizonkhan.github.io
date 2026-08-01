import type { ThemeName } from '@/lib/theme'

/**
 * The one palette every visualisation on the site draws from. Chrome (buttons, links, focus
 * rings) is azure (`--accent` in globals.css); data is this magma-derived ramp. The two must
 * never share a hue, so a visitor can never mistake a button for a value.
 *
 * SEQ, CATEGORICAL and DIVERGING are exported as literal hex strings, not `var(...)`
 * references, because they are consumed by `CanvasRenderingContext2D.fillStyle`, where CSS
 * custom properties do not resolve: an invalid `fillStyle` is silently ignored rather than
 * thrown, which leaves the previous fill in place and produces a chart that is wrong rather
 * than blank. The same values are also declared as CSS custom properties in globals.css for
 * the SVG/DOM legend (ScaleLegend), so canvas and DOM never drift apart. They are identical
 * in both themes, so only HAIRLINE and ACCENT below are theme-keyed.
 */

export const SEQ: readonly [string, string, string, string, string, string, string] = [
  '#1D1147',
  '#3F1073',
  '#6A1F81',
  '#9A2E7E',
  '#C94371',
  '#EE6A5E',
  '#FBA55F',
]

/** Max 6 entries. Each must be paired with a second, non-colour channel in the consuming chart. */
export const CATEGORICAL: readonly string[] = [
  '#0E9AA0',
  '#E0912F',
  '#7A5CD6',
  '#DD5E5E',
  '#3F9E63',
  '#5B7192',
]

export const DIVERGING = {
  neg: '#2B7C8C',
  mid: '#8D8D93',
  pos: '#C1553B',
} as const

/** For SVG and DOM, where var() resolves. */
export const HAIRLINE_CSS = 'var(--viz-hairline)'

/** The literal values behind --viz-hairline, for canvas fillStyle/strokeStyle. */
export const HAIRLINE: Record<ThemeName, string> = {
  light: 'rgba(11, 12, 14, 0.16)',
  dark: 'rgba(246, 246, 244, 0.14)',
}

/**
 * The literal values behind --accent. Canvas selection chrome only, which on this site means
 * the kernel window outline and the focused-borough glow. Never a data mark: accent marks
 * where the user is, never what a number is.
 */
export const ACCENT: Record<ThemeName, string> = {
  light: '#12539E',
  dark: '#79ACF2',
}

/**
 * Maps a value to a ramp index 0..6 given six ascending breakpoints. Values below `breaks[0]`
 * map to 0; values at or above `breaks[5]` map to 6.
 */
export function rampIndexFor(value: number, breaks: readonly number[]): number {
  let index = 0
  for (const breakpoint of breaks) {
    if (value >= breakpoint) index += 1
    else break
  }
  return Math.min(index, SEQ.length - 1)
}
