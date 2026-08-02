import { techniques } from '@/content/techniques'
import { Prose } from '@/components/ui/Prose'
import { Pill } from '@/components/ui/Pill'

/**
 * The Concepts section: the boundary statement first, because the constraint has to be read
 * before the content it constrains, then one anchored article per general method. Each
 * article is the landing target for the inline concept links rendered in the timeline above,
 * via AnnotatedHighlight and GlossaryTerm.
 */
export function ConceptNotes() {
  return (
    <div className="flex flex-col gap-(--space-block)">
      <p className="text-body max-w-(--measure-prose) text-text-secondary">
        The highlighted terms in the timeline above link here.
      </p>
      <div className="rounded-lg border border-border-subtle bg-surface-1 p-6">
        <p className="text-body font-medium text-text-primary">
          These are descriptions of general methods. Nothing here reflects any employer’s
          models, parameters, thresholds, portfolios or systems.
        </p>
      </div>
      <ul className="flex flex-col gap-(--space-block)">
        {techniques.map((note) => (
          <li key={note.id}>
            <article
              id={`technique-${note.id}`}
              tabIndex={-1}
              className="scroll-mt-24"
              aria-labelledby={`technique-${note.id}-title`}
            >
              <div className="flex items-center gap-3">
                <h3 id={`technique-${note.id}-title`} className="text-h3 text-text-primary">
                  {note.title}
                </h3>
                <Pill tone="muted">General method</Pill>
              </div>
              <Prose className="mt-3">
                {note.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </Prose>
              <a href="#roles" className="mt-4 inline-block text-small text-accent">
                Back to the roles <span aria-hidden="true">↑</span>
              </a>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
