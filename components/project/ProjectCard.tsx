import Link from 'next/link'
import clsx from 'clsx'
import type { ProjectRecord } from '@/content/projects/types'
import { Pill } from '@/components/ui/Pill'

export interface ProjectCardProps {
  record: ProjectRecord
  /** 'index' on /projects/, 'home' on the landing page (denser). */
  variant?: 'index' | 'home'
}

const CARD_BASE =
  'flex h-full flex-col gap-4 rounded-lg border border-border-subtle bg-surface-1 p-6 shadow-card'

/** A project's card on the index or the landing page. Planned records render inert. */
export function ProjectCard({ record, variant = 'index' }: ProjectCardProps) {
  const dense = variant === 'home'

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-tick uppercase tracking-wide text-text-tertiary">{record.year}</span>
        {record.status === 'planned' && <Pill tone="muted">Write-up in progress</Pill>}
      </div>
      <h3 className="text-h3 text-text-primary">{record.title}</h3>
      <p className={clsx('text-small text-text-secondary', dense && 'line-clamp-3')}>
        {record.tagline}
      </p>
      {!dense && (
        <ul className="mt-auto flex flex-wrap gap-2 pt-2">
          {record.stack.slice(0, 4).map((item) => (
            <li key={item}>
              <Pill>{item}</Pill>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  if (record.status === 'planned') {
    return (
      <article className={clsx(CARD_BASE, 'opacity-70')} aria-label={`${record.title}, write-up in progress`}>
        {body}
      </article>
    )
  }

  return (
    <Link
      href={`/projects/${record.slug}/`}
      className={clsx(
        CARD_BASE,
        'transition-colors duration-(--dur-fast) hover:border-border-strong',
      )}
    >
      {body}
    </Link>
  )
}
