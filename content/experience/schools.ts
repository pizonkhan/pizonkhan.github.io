/**
 * Per-school colour pair, monogram and optional image slot for the education brand plates on
 * /experience/. See docs/plans/experience-page-v2.md, assumptions 1-3, for why this ships a
 * two-letter monogram in the site's own typeface rather than a mascot or a logotype: neither
 * school's mark is licensed for use on an unaffiliated personal portfolio.
 */

export interface SchoolPalette {
  /** Plate fill. */
  fill: string
  /** Monogram colour on that fill. Must clear 4.5:1 against `fill`. */
  ink: string
}

export interface SchoolMark {
  /** Must equal an Education.school string in content/profile.ts exactly. */
  school: string
  /**
   * Two letters set in the site's own typeface. A plain abbreviation, not a reproduction of
   * any registered logotype, and specifically not the interlocking GT mark.
   */
  monogram: string
  light: SchoolPalette
  dark: SchoolPalette
  /**
   * Optional drop-in replacement for the plate. Set this only if Pizon holds the right to
   * publish the artwork. Path relative to public/, passed through withBasePath() at render.
   * Drop the file at public/schools/<file> and fill this in; nothing else changes.
   */
  image?: { src: string; alt: string; width: number; height: number }
}

export const schoolMarks: SchoolMark[] = [
  {
    school: 'Georgia Institute of Technology',
    monogram: 'GT',
    // brand.gatech.edu/our-look/colors: Navy #051E39, Gold #B39051. The Institute palette,
    // not the athletics pair (#003057 / #B3A369) that third-party colour sites publish.
    light: { fill: '#051E39', ink: '#B39051' },
    dark: { fill: '#B39051', ink: '#051E39' },
  },
  {
    school: 'Queens College, City University of New York',
    monogram: 'QC',
    // Queens College's school colours are silver and navy. The College does not publish a
    // primary hex pair publicly, so this is an unverified third-party value
    // (teamcolorcodes.com, Queens College Knights), not an official one, and no Pantone number
    // is claimed for it.
    // TODO(pizon:) confirm against the official Brand Graphics Guidelines, or supply the pair.
    light: { fill: '#003A63', ink: '#C3D2E1' },
    dark: { fill: '#C3D2E1', ink: '#003A63' },
  },
]
