/**
 * Length of a path made only of absolute M and L commands, and the DrawPath shape every
 * stroke-reveal figure declares its geometry with.
 *
 * The tokenizer is the same one components/business/business-geometry.ts keeps its own copy
 * of. That module is deliberately left alone so this feature's manifest stays disjoint;
 * unifying the two copies is a later, separate change.
 */

export interface DrawPath {
  d: string
  /** stroke-dasharray and the unrevealed stroke-dashoffset. Always at least the true length. */
  length: number
  /** Stroke width in user units. Default 1.5. */
  width?: number
  /** Which ink token this path draws in. Default 'primary'. */
  tone?: 'primary' | 'tertiary'
}

/** Length of a path made only of absolute M and L commands. Throws on anything else. */
export function polylineLength(d: string): number {
  const tokens = d.trim().split(/\s+/)
  let index = 0
  let length = 0
  let current: [number, number] | null = null

  while (index < tokens.length) {
    const command = tokens[index]
    if (command !== 'M' && command !== 'L') {
      throw new Error(`polylineLength: unsupported command "${command}" in "${d}"`)
    }
    const x = Number(tokens[index + 1])
    const y = Number(tokens[index + 2])
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw new Error(`polylineLength: unparseable coordinate near "${command}" in "${d}"`)
    }
    if (command === 'L' && current !== null) {
      length += Math.hypot(x - current[0], y - current[1])
    }
    current = [x, y]
    index += 3
  }

  return length
}
