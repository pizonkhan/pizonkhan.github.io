'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { profile } from '@/content/profile'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { Portrait } from '@/components/ui/Portrait'

/**
 * Loaded only once HeroNeighborFill decides the viewport is wide enough to show it, so its
 * code never counts against '/'s first-load JS on the route that has to fit a 120 KB budget.
 */
const NeighborFill = dynamic(
  () => import('@/components/home/HeroNeighborFill').then((mod) => mod.HeroNeighborFill),
  { ssr: false },
)

/**
 * The first viewport: name, role, one sentence of positioning, two calls to action, and,
 * beside it on wide screens, the neighbor-fill glyph and the portrait. Below 1024px the right
 * column does not render and the portrait moves above the eyebrow instead.
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
        <div className="flex flex-col gap-6">
          <div className="hero-fade-up lg:hidden">
            <Portrait size={88} shape="circle" priority />
          </div>
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
            <ButtonLink href="/projects/">See the demonstrations</ButtonLink>
            <ButtonLink href="/experience/" variant="ghost">
              Experience
            </ButtonLink>
          </div>
        </div>

        <div className="hidden flex-col items-end gap-6 lg:flex">
          <div className="w-full max-w-[320px]">
            <HeroNeighborFill />
          </div>
          <Portrait size={120} shape="circle" caption="Pizon Khan · NYC" priority />
        </div>
      </Container>
    </section>
  )
}

/**
 * Mounts HeroNeighborFill only once a post-hydration matchMedia check confirms the viewport is
 * wide enough to render the right column at all. The server renders nothing here, so there is
 * no hydration mismatch, and a mobile visitor never pays for the glyph's markup or its timers:
 * it is decorative and dropped entirely below 1024px, not just CSS-hidden.
 */
function HeroNeighborFill() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    setShow(query.matches)

    const onChange = (event: MediaQueryListEvent) => setShow(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  if (!show) return null
  return <NeighborFill />
}
