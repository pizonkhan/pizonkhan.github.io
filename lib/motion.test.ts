import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Regression guard for the reveal bug: useInViewOnce's default threshold used to be 0.25,
 * which is unreachable for any section taller than four times the effective root. See
 * docs/plans/remediation-pass-3-experience-reveal-and-overflow.md for the measured before
 * and after on /experience/.
 */

const SOURCE_PATH = path.resolve(__dirname, 'motion.ts')

describe('lib/motion.ts useInViewOnce default threshold', () => {
  const source = readFileSync(SOURCE_PATH, 'utf8')

  it('defaults threshold to 0', () => {
    expect(source).toMatch(/threshold\s*=\s*options\?\.threshold\s*\?\?\s*0\b/)
  })

  it('does not default threshold to 0.25', () => {
    expect(source).not.toMatch(/\?\?\s*0\.25/)
  })

  it('still defaults rootMargin to \'0px 0px -15% 0px\'', () => {
    expect(source).toMatch(/rootMargin\s*=\s*options\?\.rootMargin\s*\?\?\s*'0px 0px -15% 0px'/)
  })
})

describe('the arithmetic that makes any non-zero default wrong', () => {
  const SHORTEST_SUPPORTED_VIEWPORT_PX = 667 // iPhone SE, the shortest phone in the matrix
  const BOTTOM_ROOT_MARGIN = 0.15 // the '-15%' in the default rootMargin
  const TALLEST_SECTION_PX = 3931 // measured: the Concepts section at 375 px wide

  it('the tallest section cannot reach any non-zero threshold on the shortest phone', () => {
    const rootHeight = SHORTEST_SUPPORTED_VIEWPORT_PX * (1 - BOTTOM_ROOT_MARGIN)
    expect(rootHeight / TALLEST_SECTION_PX).toBeLessThan(0.25)
  })
})
