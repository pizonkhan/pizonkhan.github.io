import type { ProjectRecord } from '@/content/projects/types'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Metric } from '@/components/ui/Metric'

export interface ProjectHeroProps {
  record: ProjectRecord
}

/**
 * Title, tagline, the demonstration promise and up to three headline figures. No photograph:
 * this is the overview and the result, stated in the first viewport, before any theory.
 */
export function ProjectHero({ record }: ProjectHeroProps) {
  return (
    <div className="border-b border-border-subtle py-(--space-block)">
      <Container>
        <Eyebrow>{`${record.year} · ${record.dataset.scale}`}</Eyebrow>
        <h1 className="text-h1 mt-3 text-text-primary">{record.title}</h1>
        <p className="text-lead mt-4 max-w-(--measure-prose) text-text-secondary">{record.tagline}</p>
        <div className="mt-6 max-w-(--measure-prose)">
          <Eyebrow>What moves on this page</Eyebrow>
          <p className="text-body mt-2 text-text-secondary">{record.demonstration}</p>
        </div>
        {record.headlineFigures.length > 0 && (
          <div className="mt-(--space-block) grid grid-cols-1 gap-8 sm:grid-cols-3">
            {record.headlineFigures.map((figure) => (
              <Metric key={figure.label} value={figure.value} label={figure.label} source={figure.source} />
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
