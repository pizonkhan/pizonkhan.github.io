import type { Metadata } from 'next'
import { site } from '@/content/site'
import { projects } from '@/content/projects'
import { Section } from '@/components/ui/Section'
import { ProjectCard } from '@/components/project/ProjectCard'

export const metadata: Metadata = {
  title: `Projects · ${site.name}`,
  description:
    'The demonstrations: project pages that run the pipeline, the model and the data in '
    + 'front of you.',
}

export default function ProjectsPage() {
  return (
    <Section eyebrow="Projects" heading="Some of my projects.">
      <p className="text-lead max-w-(--measure-prose) text-text-secondary">
        I like to keep learning: new modeling techniques, new tools, whatever is moving in
        machine learning and engineering. These are a few examples of that in practice.
      </p>
      <div className="mt-(--space-block) grid grid-cols-1 gap-6 sm:grid-cols-2">
        {projects.map((record) => (
          <ProjectCard key={record.slug} record={record} />
        ))}
      </div>
    </Section>
  )
}
