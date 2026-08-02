import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Regression guard for a verified overflow bug, now fixed: GlossaryTerm's closed preview used
 * to hide with `visibility: hidden`, which keeps the box in layout at `left: 0, width: 256px`
 * relative to its term. A term near the right edge pushed that box past the viewport, and on
 * /experience/ at 375 px that measured 571 px document.documentElement.scrollWidth against a
 * 375 px clientWidth, a 196 px horizontal scroll on load with no interaction.
 *
 * The fix hides the closed preview with `display: none` instead, which removes it from layout
 * without removing it from the DOM, so aria-describedby still resolves. After the fix,
 * scrollWidth measures exactly 375.
 */

const SOURCE_PATH = path.resolve(__dirname, 'GlossaryTerm.tsx')

describe('components/experience/GlossaryTerm.tsx preview hiding mechanism', () => {
  const source = readFileSync(SOURCE_PATH, 'utf8')

  it('hides the closed preview with display, not visibility', () => {
    expect(source).toMatch(/display:\s*open\s*\?\s*undefined\s*:\s*'none'/)
  })

  it('sets no visibility style property anywhere in the file', () => {
    // Matches a `visibility:` object property on its own line, the shape the old inline
    // style used. Does not match the word inside the explanatory comment above the style
    // object, which discusses the old mechanism in prose.
    expect(source).not.toMatch(/^\s*visibility\s*:/m)
  })

  it('the preview node is unconditional: role and aria-describedby are present', () => {
    expect(source).toContain('role="tooltip"')
    expect(source).toContain('aria-describedby={tipId}')
  })

  it('the preview span is never conditionally rendered on open', () => {
    expect(source).not.toMatch(/open\s*&&\s*<span[\s\S]*?role="tooltip"/)
    expect(source).not.toMatch(/open\s*\?\s*<span[\s\S]*?role="tooltip"/)
  })
})
