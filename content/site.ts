/**
 * Site-level content: name, canonical URL, navigation, SEO copy, the integrity statement,
 * the logo slot and the icon set. Nothing biographical lives here, that is content/profile.ts.
 */

export interface LogoSlot {
  /** Path relative to public/. Passed through withBasePath() at render time. */
  src: string
  /** Dark-theme variant. Rendered alongside src and toggled by CSS. */
  srcDark?: string
  /** Intrinsic size. Drives the reserved box, so there is no layout shift. */
  width: number
  height: number
  /** Alt text. The mark stands alone here, so it carries the name. */
  alt: string
}

export interface SiteIcons {
  /** P-only tile. Primary icon at every size. */
  svg: string
  /** Raster fallback for clients that will not take an SVG icon. */
  png32: string
  /** apple-touch-icon. */
  apple180: string
}

export const site = {
  name: 'Pizon Khan',
  url: 'https://pizonkhan.github.io',
  title: 'Pizon Khan: data platforms, risk models, and the visuals that explain them',
  description:
    'Director of Credit Analytics in New York City. Project pages here are demonstrations: '
    + 'the pipeline, the model and the data run in front of you.',
  nav: [
    { label: 'Projects', href: '/projects/' },
    { label: 'Experience', href: '/experience/' },
  ],
  /**
   * The mark, alone. Not the lockup: the lockup carries a descriptor that is not the title on
   * the resume, and it depends on a font this site does not load. Read
   * public/logo/README.md before touching any of this.
   */
  logo: {
    src: '/logo/pk-stack-ink.svg',
    srcDark: '/logo/pk-stack-light.svg',
    width: 72,
    height: 232,
    alt: 'Pizon Khan',
  } satisfies LogoSlot,
  /** Consumed only by metadata in app/layout.tsx, where each is passed through withBasePath(). */
  icons: {
    svg: '/logo/pk-favicon-16.svg',
    png32: '/logo/png/pk-32.png',
    apple180: '/logo/png/pk-180.png',
  } satisfies SiteIcons,
} as const
