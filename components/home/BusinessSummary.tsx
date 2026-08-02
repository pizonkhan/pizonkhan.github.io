import Link from 'next/link'
import { business } from '@/content/business'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionFade } from '@/components/home/SectionFade'
import { GlyphPlate } from '@/components/business/GlyphPlate'

/**
 * A short version of /business/ for anyone who never clicks through: what the platform is
 * and a link to the full case study. Server component: the copy comes from content/business.ts
 * and only GlyphPlate, which owns its own motion hooks, needs the client.
 */
export function BusinessSummary() {
  return (
    <SectionFade>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{business.landing.eyebrow}</Eyebrow>
            <h2 className="text-h2 mt-2 text-text-primary">{business.landing.heading}</h2>
          </div>
          <Link
            href={business.landing.href}
            className="text-body font-medium text-accent transition-colors duration-(--dur-fast) hover:text-accent-hover"
          >
            {business.landing.linkLabel} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <div className="mt-(--space-block) flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <GlyphPlate kind="sedan" className="h-24 w-24 shrink-0 sm:h-28 sm:w-28" />
          <p className="text-lead max-w-(--measure-prose) text-text-secondary">
            {business.landing.body}
          </p>
        </div>
      </Container>
    </SectionFade>
  )
}
