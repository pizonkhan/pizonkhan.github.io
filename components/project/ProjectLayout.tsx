import type { ReactNode } from 'react'
import type { ProjectRecord } from '@/content/projects/types'
import { projects } from '@/content/projects'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ProjectHero } from '@/components/project/ProjectHero'
import { ProjectSection } from '@/components/project/ProjectSection'
import { ProjectMeta } from '@/components/project/ProjectMeta'

export interface ProjectLayoutProps {
  record: ProjectRecord
  /**
   * The one overarching demonstration, rendered directly under the hero as the overview and
   * result. Optional: a project whose story is carried entirely by its section visuals passes
   * nothing.
   */
  centrepiece?: ReactNode
  /**
   * Keyed by ProjectSectionBlock.id. Each entry renders inside that section, after its prose.
   * A key with no matching section id is a defect: ProjectLayout console.errors in development
   * and renders nothing for it.
   */
  sectionVisuals?: Record<string, ReactNode>
  /** Escape hatch for a figure that belongs to no single section. Expected empty. */
  supporting?: ReactNode[]
}

/**
 * The reusable demonstration template: hero and results, an optional centrepiece, the theory
 * sections in record order (each with the visual its route supplied for that section's id), the
 * rarely-used supporting block, the meta rail, and a link to the next live demonstration. Owns
 * no visualisation, no Figure wrapper, no number and no imagery of its own.
 */
export function ProjectLayout({ record, centrepiece, sectionVisuals, supporting }: ProjectLayoutProps) {
  const liveProjects = projects.filter((project) => project.status === 'live')
  const currentIndex = liveProjects.findIndex((project) => project.slug === record.slug)
  const next =
    currentIndex !== -1 && liveProjects.length > 1
      ? liveProjects[(currentIndex + 1) % liveProjects.length]
      : undefined

  if (process.env.NODE_ENV !== 'production' && sectionVisuals) {
    const sectionIds = new Set(record.sections.map((section) => section.id))
    for (const key of Object.keys(sectionVisuals)) {
      if (!sectionIds.has(key)) {
        console.error(
          `ProjectLayout: "${record.slug}" sectionVisuals has stray key "${key}" with no matching section id.`,
        )
      }
    }
  }

  return (
    <article>
      <ProjectHero record={record} />

      {centrepiece && (
        <div className="py-(--space-section)">
          <Container>{centrepiece}</Container>
        </div>
      )}

      {record.sections.map((section) => {
        const visual = sectionVisuals?.[section.id]
        if (process.env.NODE_ENV !== 'production' && section.hasVisual && !visual) {
          console.error(
            `ProjectLayout: "${record.slug}" section "${section.id}" declares hasVisual but no visual was supplied.`,
          )
        }
        return <ProjectSection key={section.id} {...section} visual={visual} />
      })}

      {supporting && supporting.length > 0 && (
        <div className="py-(--space-section)">
          <Container>
            <div className="flex flex-col gap-(--space-block)">
              {supporting.map((node, index) => (
                <div key={index}>{node}</div>
              ))}
            </div>
          </Container>
        </div>
      )}

      <ProjectMeta record={record} />

      <div className="py-(--space-section)">
        <Container>
          <div className="flex flex-col items-start gap-4 border-t border-border-subtle pt-(--space-block)">
            {next ? (
              <>
                <Eyebrow>Next demonstration</Eyebrow>
                <h2 className="text-h2 text-text-primary">{next.title}</h2>
                <ButtonLink href={`/projects/${next.slug}/`}>See the demonstration</ButtonLink>
              </>
            ) : (
              <>
                <Eyebrow>More work</Eyebrow>
                <ButtonLink href="/projects/" variant="ghost">
                  Back to the demonstrations
                </ButtonLink>
              </>
            )}
          </div>
        </Container>
      </div>
    </article>
  )
}
