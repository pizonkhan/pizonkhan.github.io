import { techniques } from '@/content/techniques'
import { Prose } from '@/components/ui/Prose'

/**
 * Three to five generic method explainers, with the boundary statement rendered above them:
 * the constraint has to be read before the content it constrains, not after.
 */
export function TechniqueNotes() {
  return (
    <div className="flex flex-col gap-(--space-block)">
      <div className="rounded-lg border border-border-subtle bg-surface-1 p-6">
        <p className="text-body font-medium text-text-primary">
          These are descriptions of general methods. Nothing here reflects any employer’s
          models, parameters, thresholds, portfolios or systems.
        </p>
      </div>
      <ul className="flex flex-col gap-(--space-block)">
        {techniques.map((note) => (
          <li key={note.id}>
            <h3 className="text-h3 text-text-primary">{note.title}</h3>
            <Prose className="mt-3">
              {note.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </Prose>
          </li>
        ))}
      </ul>
    </div>
  )
}
