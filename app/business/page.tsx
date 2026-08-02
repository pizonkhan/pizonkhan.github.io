import type { Metadata } from 'next'
import { site } from '@/content/site'
import { business } from '@/content/business'
import { Section } from '@/components/ui/Section'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Prose } from '@/components/ui/Prose'
import { Metric } from '@/components/ui/Metric'
import { Pill } from '@/components/ui/Pill'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ChauffeurRouteVisual } from '@/components/business/ChauffeurRouteVisual'
import { AudienceGrid } from '@/components/business/AudienceGrid'
import { CapabilityList } from '@/components/business/CapabilityList'
import { PricingFlow } from '@/components/business/PricingFlow'
import { GlyphPlate } from '@/components/business/GlyphPlate'

export const metadata: Metadata = {
  title: `Business · ${site.name}`,
  description: business.metaDescription,
}

/**
 * The chauffeur platform case study. A career write-up, not a demonstration: there is no
 * pipeline or model running here, so this route sits outside content/projects/index.ts and
 * gets no ProjectRecord. See the plan for why.
 */
export default function BusinessPage() {
  return (
    <>
      <div className="border-b border-border-subtle py-(--space-block)">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr] lg:items-start lg:gap-16">
          <div>
            <Eyebrow>{business.eyebrow}</Eyebrow>
            <h1 className="text-h1 mt-3 text-text-primary">{business.heading}</h1>
            <p className="text-lead mt-4 max-w-(--measure-prose) text-text-secondary">{business.lead}</p>
            <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
              {business.modernization.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-small text-accent hover:text-accent-hover"
                  >
                    {link.label} <span aria-hidden="true">&rarr;</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-(--space-block) grid grid-cols-1 gap-8 sm:grid-cols-3">
              {business.figures.map((figure) => (
                <Metric key={figure.label} value={figure.value} label={figure.label} source={figure.source} />
              ))}
            </div>
          </div>
          <div className="w-full max-w-[360px] justify-self-center lg:justify-self-end">
            <ChauffeurRouteVisual />
          </div>
        </Container>
      </div>

      <Section eyebrow={business.background.eyebrow} heading={business.background.heading}>
        <Prose>
          {business.background.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </Section>

      <Section eyebrow={business.platform.eyebrow} heading={business.platform.heading}>
        <Prose>
          {business.platform.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-(--space-block)">
          <AudienceGrid />
        </div>
      </Section>

      <Section eyebrow={business.portal.eyebrow} heading={business.portal.heading}>
        <p className="text-lead max-w-(--measure-prose) text-text-secondary">{business.portal.intro}</p>
        <div className="mt-(--space-block)">
          <CapabilityList />
        </div>
      </Section>

      <Section eyebrow={business.pricing.eyebrow} heading={business.pricing.heading}>
        <Prose>
          {business.pricing.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-(--space-block)">
          <PricingFlow />
        </div>
      </Section>

      <Section eyebrow={business.assistant.eyebrow} heading={business.assistant.heading}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[2fr_1fr] sm:items-start">
          <Prose>
            {business.assistant.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Prose>
          <figure className="flex flex-col items-center gap-3 sm:items-start">
            <GlyphPlate kind="handoff" className="h-40 w-40 sm:h-48 sm:w-48" />
            <figcaption className="viz-caption">{business.assistant.glyphCaption}</figcaption>
          </figure>
        </div>
      </Section>

      <Section eyebrow={business.modernization.eyebrow} heading={business.modernization.heading}>
        <Prose>
          {business.modernization.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <ul className="mt-(--space-block) grid grid-cols-1 gap-6 sm:grid-cols-2">
          {business.modernization.links.map((link) => (
            <li key={link.href} className="rounded-lg border border-border-subtle bg-surface-1 p-6">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-h3 text-text-primary hover:text-accent"
              >
                {link.label} <span aria-hidden="true">&rarr;</span>
              </a>
              <p className="mt-2 text-small text-text-secondary">{link.note}</p>
              <p className="mt-1 text-tick text-text-tertiary">{new URL(link.href).hostname}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow={business.stack.eyebrow} heading={business.stack.heading}>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <ul className="flex flex-wrap gap-2">
            {business.stack.items.map((item) => (
              <li key={item}>
                <Pill>{item}</Pill>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="text-h3 text-text-primary">{business.skills.heading}</h3>
            <ul className="mt-3 flex flex-col gap-2 text-body text-text-secondary">
              {business.skills.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <div className="border-t border-border-subtle py-(--space-section)">
        <Container>
          <div className="flex flex-wrap gap-4">
            <ButtonLink href="/projects/">Some of my projects</ButtonLink>
            <ButtonLink href="/experience/" variant="ghost">
              My experience
            </ButtonLink>
          </div>
        </Container>
      </div>
    </>
  )
}
