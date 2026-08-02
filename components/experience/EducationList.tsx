import { education } from '@/content/profile'
import { schoolMarks } from '@/content/experience/schools'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SchoolMark } from '@/components/experience/SchoolMark'

/** Education, rendered unchanged from content/profile.ts, with each school's own brand plate beside it. */
export function EducationList() {
  return (
    <ul className="flex flex-col gap-6">
      {education.map((entry) => {
        const mark = schoolMarks.find((candidate) => candidate.school === entry.school)
        return (
          <li key={entry.school} className="flex items-start gap-4">
            {mark && <SchoolMark mark={mark} />}
            <div className="min-w-0">
              <Eyebrow>{entry.graduated}</Eyebrow>
              <h3 className="text-h3 mt-1 text-text-primary">{entry.school}</h3>
              <p className="text-body text-text-secondary">{entry.credential}</p>
              {entry.detail && <p className="mt-1 text-small text-text-tertiary">{entry.detail}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
