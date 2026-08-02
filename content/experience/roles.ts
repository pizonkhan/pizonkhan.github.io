/**
 * Which role gets which glyph. Assignment is per role, not per employer, because Webster's
 * three roles are the whole point of the career arc and giving them one shared mark would
 * erase it. Keyed by lib/glossary.ts's roleKey(company, title).
 *
 * RoleGlyphKind is declared here, not in components/experience/RoleGlyph.tsx, so this module
 * has no dependency on that component: content owns which role gets which kind, and
 * RoleGlyph.tsx imports and re-exports the union from here.
 */
export type RoleGlyphKind = 'platform' | 'boundary' | 'neighbors' | 'orchestration' | 'segments'

export const roleGlyphs: Record<string, RoleGlyphKind> = {
  'Webster Bank|Director, Credit Analytics': 'platform',
  'Webster Bank|Manager, Data Science': 'boundary',
  'Webster Bank|Data Scientist': 'neighbors',
  'Whiterock.ai|Data Scientist': 'orchestration',
  'ProMarketingHub|Junior Data Scientist': 'segments',
}
