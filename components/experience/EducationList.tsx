import { education } from '@/content/profile'
import { Eyebrow } from '@/components/ui/Eyebrow'

/** Education, verbatim from content/profile.ts. */
export function EducationList() {
  return (
    <ul className="flex flex-col gap-6">
      {education.map((entry) => (
        <li key={entry.school}>
          <Eyebrow>{entry.graduated}</Eyebrow>
          <h3 className="text-h3 mt-1 text-text-primary">{entry.school}</h3>
          <p className="text-body text-text-secondary">{entry.credential}</p>
          {entry.detail && <p className="mt-1 text-small text-text-tertiary">{entry.detail}</p>}
        </li>
      ))}
    </ul>
  )
}
