'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { profile } from '@/content/profile'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Portrait } from '@/components/ui/Portrait'
import { HERO_GLYPH_KINDS, type HeroGlyphKind } from '@/components/home/hero-glyph-kind'

/**
 * Loaded client-side only, so none of the three glyphs' code counts against '/'s first-load JS
 * on the route that has to fit a 120 KB budget. All three share this one dynamic() call and
 * chunk; which one renders is decided by the `kind` prop, not by which import ran.
 */
const HeroGlyph = dynamic(
  () => import('@/components/home/hero-glyphs').then((mod) => mod.HeroGlyph),
  { ssr: false },
)

/**
 * The first viewport: name, role, one sentence of positioning, two calls to action, and, on
 * every screen size, the cycling glyph and the portrait. On wide screens they sit in a column
 * to the right of the text; below 1024px they collapse into one identity block (glyph, then
 * portrait) shown above the text instead, at a smaller size, via CSS `order` rather than a
 * second copy of either.
 *
 * The intro reveal (headline clip-path mask, staggered fade-ups) is plain CSS animation
 * (`.hero-clip-reveal` / `.hero-fade-up` in globals.css), present in the server-rendered
 * markup so it plays at first paint with no JavaScript and no framer-motion on this route.
 * `prefers-reduced-motion` is handled by the global CSS net, not a JS check.
 */
export function Hero() {
  return (
    <section className="border-b border-border-subtle">
      <Container className="grid grid-cols-1 gap-10 py-(--space-section) lg:grid-cols-[2fr_1fr] lg:items-start lg:gap-16">
        <div className="order-2 flex flex-col gap-6 lg:order-1">
          <div className="hero-fade-up">
            <Eyebrow>New York City</Eyebrow>
          </div>
          <h1 className="hero-clip-reveal text-display text-text-primary">{profile.name}</h1>
          <p className="hero-fade-up hero-delay-1 text-lead text-text-secondary">
            {profile.headline} · {profile.company}
          </p>
          <p className="hero-fade-up hero-delay-2 max-w-[52ch] text-lead text-text-secondary">
            {profile.summary}
          </p>
          <div className="hero-fade-up hero-delay-3 flex flex-wrap gap-4">
            <ButtonLink href="/experience/">Resume</ButtonLink>
            <ButtonLink href="/projects/" variant="ghost">
              Projects
            </ButtonLink>
          </div>
        </div>

        <div className="order-1 flex flex-col items-center gap-6 lg:order-2 lg:items-end">
          <div className="hero-fade-up w-[200px] sm:w-[240px] lg:w-full lg:max-w-[320px]">
            <HeroVisual />
          </div>
          <div className="lg:hidden">
            <Portrait size={88} shape="circle" priority />
          </div>
          <div className="hidden lg:block">
            <Portrait size={120} shape="circle" caption="Pizon Khan · NYC" priority />
          </div>
        </div>
      </Container>
    </section>
  )
}

/**
 * Rolls a random glyph kind once per mount, i.e. once per page load or client-side navigation
 * to "/", so a returning visitor sees a different demonstration each time, on any screen size.
 * Nothing renders until the roll resolves, so there is no flash of a wrong or empty glyph and
 * no hydration mismatch: the server renders nothing, and the client fills in after mount.
 */
function HeroVisual() {
  const [kind, setKind] = useState<HeroGlyphKind | null>(null)

  useEffect(() => {
    // One-shot: rolled once after mount and never re-rolled, so a reduced-motion change or a
    // resize across the 1024px breakpoint mid-visit never swaps the glyph underneath the visitor.
    const roll = HERO_GLYPH_KINDS[Math.floor(Math.random() * HERO_GLYPH_KINDS.length)]
    setKind(roll)
  }, [])

  if (!kind) return null
  return <HeroGlyph kind={kind} />
}
