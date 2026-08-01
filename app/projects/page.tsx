import type { Metadata } from 'next'
import { site } from '@/content/site'
import { projects } from '@/content/projects'
import { Section } from '@/components/ui/Section'
import { ProjectCard } from '@/components/project/ProjectCard'

export const metadata: Metadata = {
  title: `Work · ${site.name}`,
  description:
    'The demonstrations: project pages that run the pipeline, the model and the data in '
    + 'front of you.',
}

export default function ProjectsPage() {
  return (
    <Section eyebrow="Work" heading="The project pages are the demonstration.">
      <p className="text-lead max-w-(--measure-prose) text-text-secondary">
        A link to a repository proves nothing. These pages run the work in front of you.
      </p>
      <div className="mt-(--space-block) grid grid-cols-1 gap-6 sm:grid-cols-2">
        {projects.map((record) => (
          <ProjectCard key={record.slug} record={record} />
        ))}
      </div>
    </Section>
  )
}
