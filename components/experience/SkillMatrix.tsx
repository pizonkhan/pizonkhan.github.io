import { skills } from '@/content/profile'
import { Eyebrow } from '@/components/ui/Eyebrow'

/** The full five skill groups from content/profile.ts, verbatim, nothing truncated. */
export function SkillMatrix() {
  return (
    <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      {skills.map((group) => (
        <div key={group.group} className="border-t border-border-subtle pt-4">
          <dt>
            <Eyebrow>{group.group}</Eyebrow>
          </dt>
          <dd className="mt-2 text-body text-text-secondary">{group.items.join(', ')}</dd>
        </div>
      ))}
    </dl>
  )
}
