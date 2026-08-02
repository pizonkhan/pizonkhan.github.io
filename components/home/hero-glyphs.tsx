'use client'

import { HeroNeighborFill } from './HeroNeighborFill'
import { HeroLinearFit } from './HeroLinearFit'
import { HeroForestSplit } from './HeroForestSplit'
import type { HeroGlyphKind } from './hero-glyph-kind'

export { HeroNeighborFill } from './HeroNeighborFill'
export { HeroLinearFit } from './HeroLinearFit'
export { HeroForestSplit } from './HeroForestSplit'
export type { HeroGlyphKind } from './hero-glyph-kind'
export { HERO_GLYPH_KINDS } from './hero-glyph-kind'

const GLYPHS: Record<HeroGlyphKind, () => React.JSX.Element> = {
  neighbors: HeroNeighborFill,
  linear: HeroLinearFit,
  forest: HeroForestSplit,
}

/**
 * The single component Hero.tsx's one dynamic() call loads. All three glyphs live in this one
 * chunk, so a page load pays for one code-split boundary rather than a race between three, and
 * picking a different kind on the next page load never triggers a second network request.
 */
export function HeroGlyph({ kind }: { kind: HeroGlyphKind }) {
  const Glyph = GLYPHS[kind]
  return <Glyph />
}
