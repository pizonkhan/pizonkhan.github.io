/**
 * Small, hand-rolled scale helpers. No d3-scale / visx dependency: these are the ~80 lines
 * the site's canvas and SVG visualisations need, and nothing more.
 */

/** Maps a value from `domain` to `range`, linearly. Does not clamp. */
export function linearScale(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0
  if (span === 0) return () => r0
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0)
}

/** [min, max] of a numeric array. */
export function extent(values: readonly number[]): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }
  return [min, max]
}

/**
 * Splits a sorted array into `bins` equal-count groups and returns the `bins - 1` breakpoints
 * between them (e.g. `bins = 7` returns the six septile breakpoints used by the sequential
 * ramp).
 */
export function quantileBreaks(sorted: readonly number[], bins: number): number[] {
  if (sorted.length === 0 || bins < 2) return []
  const breaks: number[] = []
  for (let k = 1; k < bins; k += 1) {
    const position = (k / bins) * (sorted.length - 1)
    const lower = Math.floor(position)
    const upper = Math.ceil(position)
    const weight = position - lower
    const value = sorted[lower] + (sorted[upper] - sorted[lower]) * weight
    breaks.push(value)
  }
  return breaks
}

/** Round, human-legible tick values spanning `domain`, roughly `count` of them. */
export function niceTicks(domain: [number, number], count = 5): number[] {
  const [start, stop] = domain
  if (start === stop || !Number.isFinite(start) || !Number.isFinite(stop)) return [start]

  const span = stop - start
  const step = niceStep(span / Math.max(count, 1))
  const niceStart = Math.floor(start / step) * step
  const niceStop = Math.ceil(stop / step) * step

  const ticks: number[] = []
  for (let tick = niceStart; tick <= niceStop + step / 2; tick += step) {
    ticks.push(Math.round(tick / step) * step)
  }
  return ticks
}

function niceStep(rawStep: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const residual = rawStep / magnitude
  let niceResidual: number
  if (residual <= 1) niceResidual = 1
  else if (residual <= 2) niceResidual = 2
  else if (residual <= 5) niceResidual = 5
  else niceResidual = 10
  return niceResidual * magnitude
}
