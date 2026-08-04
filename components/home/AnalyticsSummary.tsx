import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionFade } from '@/components/home/SectionFade'

/**
 * A short pointer to /projects/site-analytics/ under the Projects section. Server component:
 * a plain paragraph, no fetch, no client state.
 */
export function AnalyticsSummary() {
  return (
    <SectionFade section="analytics">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Analytics</Eyebrow>
            <h2 className="text-h2 mt-2 text-text-primary">I built the analytics running on this site too.</h2>
          </div>
          <Link
            href="/projects/site-analytics/"
            className="text-body font-medium text-accent transition-colors duration-(--dur-fast) hover:text-accent-hover"
          >
            See the dashboard <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <p className="text-lead mt-(--space-block) max-w-(--measure-prose) text-text-secondary">
          Every page view, click and time-on-page reading on this site comes from a worker and
          a database I wrote myself, not a third-party script. No cookie, no stored identifier.
          The dashboard reads the same pipeline live, with a diagram tracing one event from the
          browser to the row it just read.
        </p>
      </Container>
    </SectionFade>
  )
}
