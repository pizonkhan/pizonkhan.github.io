/**
 * The three hero glyph variants and the kind identifier Hero.tsx uses to pick one at random
 * after mount. Lives outside hero-glyphs.tsx (the barrel that actually imports the three
 * components) so Hero.tsx can read the kind list and roll a random choice without statically
 * pulling the glyph components themselves into the '/' bundle. Only hero-glyphs.tsx, loaded
 * through the single dynamic() call in Hero.tsx, imports the real components.
 */
export type HeroGlyphKind = 'neighbors' | 'linear' | 'forest'

export const HERO_GLYPH_KINDS: readonly HeroGlyphKind[] = ['neighbors', 'linear', 'forest']
