import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Regression guard for a verified rendering bug, now fixed: app/globals.css used to declare
 * a plain, unlayered `a { color: inherit; }` rule. Because Tailwind's own utilities are
 * emitted inside `@layer utilities`, and CSS gives every unlayered rule priority over every
 * layered rule regardless of selector specificity, that rule silently won over every
 * `text-*` colour utility applied to an <a> element site-wide.
 *
 * The observed effect before the fix (verified with Lighthouse against the built export):
 * ButtonLink's primary variant (`bg-accent text-accent-contrast`) rendered its intended
 * white-on-accent text as the inherited ambient colour instead, measured at 2.56:1 contrast
 * against the required 4.5:1, on both "See the demonstrations" (/) and "The work I can show
 * you in full ->" (/experience/). Every anchor-based hover colour change (header nav,
 * ContactBlock's GitHub/LinkedIn links) was silently inert for the same reason.
 *
 * The fix moves the rule inside `@layer base`, so it takes its place in Tailwind's own layer
 * order and every `text-*` utility in `@layer utilities` outranks it again. This test now
 * pins that fixed shape down so the rule cannot silently drift back out of the layer.
 */

const CSS_PATH = path.resolve(__dirname, 'globals.css')

describe('app/globals.css anchor colour rule', () => {
  const css = readFileSync(CSS_PATH, 'utf8')

  it('declares a bare `a { color: inherit; }` rule', () => {
    expect(css).toMatch(/\ba\s*\{\s*color:\s*inherit;?\s*\}/)
  })

  it('that rule is nested inside an @layer base block, so Tailwind utilities outrank it', () => {
    const layerMatch = css.match(/@layer base\s*\{([\s\S]*?)\n\}/)
    expect(layerMatch).not.toBeNull()
    expect(layerMatch?.[1]).toMatch(/\ba\s*\{\s*color:\s*inherit;?\s*\}/)
  })
})
