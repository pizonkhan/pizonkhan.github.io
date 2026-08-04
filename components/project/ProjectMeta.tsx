import type { ProjectRecord } from '@/content/projects/types'
import { Container } from '@/components/ui/Container'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Pill } from '@/components/ui/Pill'

export interface ProjectMetaProps {
  record: ProjectRecord
}

/** Stack pills, dataset provenance, and the public links rail that closes out a project write-up. */
export function ProjectMeta({ record }: ProjectMetaProps) {
  return (
    <div data-section="project-meta" className="border-t border-border-subtle py-(--space-section)">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <Eyebrow>Stack</Eyebrow>
            <ul className="mt-3 flex flex-wrap gap-2">
              {record.stack.map((item) => (
                <li key={item}>
                  <Pill>{item}</Pill>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Eyebrow>Dataset</Eyebrow>
            {record.dataset.href ? (
              <a
                href={record.dataset.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-body text-text-primary hover:text-accent"
              >
                {record.dataset.name}
              </a>
            ) : (
              <p className="mt-3 text-body text-text-primary">{record.dataset.name}</p>
            )}
            <p className="mt-1 text-small text-text-secondary">{record.dataset.scale}</p>
            <p className="mt-2 text-tick text-text-tertiary">{record.dataset.provenance}</p>
          </div>
          <div>
            <Eyebrow>Links</Eyebrow>
            <ul className="mt-3 flex flex-col gap-2">
              {record.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-small text-accent hover:text-accent-hover"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-(--space-block) max-w-(--measure-prose) text-tick text-text-tertiary">
          {record.dataStatement}
        </p>
      </Container>
    </div>
  )
}
