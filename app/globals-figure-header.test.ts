import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Regression guard for a verified overflow bug, now fixed: .viz-figure-header is a two-child
 * flex row (title block, figure controls), and a wide controls node, the four-option model
 * selector in components/projects/nyc2025/ModelMechanisms.tsx, could not fit beside its title
 * at 375 px. That measured 439 px document.documentElement.scrollWidth against a 375 px
 * clientWidth on /projects/nyc-home-sales-2025/ once the model figure mounted.
 *
 * The fix adds flex-wrap: wrap so the controls drop to a second line instead of pushing the
 * page sideways. min-width: 0 on the header's children was tried and rejected: measured, it
 * makes the overflow worse, 439 px to 534 px. flex-wrap alone gives exactly 375 px.
 */

const CSS_PATH = path.resolve(__dirname, 'globals.css')

describe('app/globals.css .viz-figure-header', () => {
  const css = readFileSync(CSS_PATH, 'utf8')
  const headerBlock = css.match(/\.viz-figure-header\s*\{([\s\S]*?)\}/)?.[1] ?? ''

  it('exists and wraps', () => {
    expect(headerBlock).not.toBe('')
    expect(headerBlock).toMatch(/flex-wrap:\s*wrap;?/)
  })

  it('does not set min-width on the rule (measured to worsen the overflow, not fix it)', () => {
    expect(headerBlock).not.toMatch(/min-width/)
  })

  it('no rule anywhere in the file masks horizontal overflow with overflow-x: hidden on html or body', () => {
    expect(css).not.toMatch(/\b(html|body)\b[^{]*\{[^}]*overflow-x:\s*hidden/)
  })
})
