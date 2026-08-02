import { describe, expect, it } from 'vitest'
import { education, experience, profile, skills } from '@/content/profile'
import { techniques } from '@/content/techniques'
import { roleKey, splitHighlight } from '@/lib/glossary'
import { highlightAnnotations } from './glossary'
import { experienceIntro } from './intro'
import { roleGlyphs, type RoleGlyphKind } from './roles'
import { schoolMarks } from './schools'

/**
 * Integrity guards across the experience-page content modules and content/profile.ts. Pins
 * acceptance criteria 6, 7, 8, 9 and 11 from docs/plans/experience-page-v2.md: nothing in this
 * feature can silently drift from a résumé fact, and the "not every bullet gets a link"
 * decision cannot silently widen or narrow.
 */

const VALID_GLYPH_KINDS: readonly RoleGlyphKind[] = [
  'platform',
  'boundary',
  'neighbors',
  'orchestration',
  'segments',
]

const roleEntries = experience.flatMap((employer) =>
  employer.roles.map((role) => ({
    employer,
    role,
    key: roleKey(employer.company, role.title),
  })),
)

function bulletFor(key: string, index: number): string | undefined {
  return roleEntries.find((entry) => entry.key === key)?.role.highlights[index]
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings)
  return []
}

describe('lib/glossary.ts roleKey, over the real résumé', () => {
  it('is unique across all five roles', () => {
    const keys = roleEntries.map((entry) => entry.key)
    expect(keys).toHaveLength(5)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('content/experience/roles.ts', () => {
  it('has exactly one entry per role, and every value is a valid glyph kind', () => {
    expect(Object.keys(roleGlyphs).sort()).toEqual(roleEntries.map((entry) => entry.key).sort())
    for (const kind of Object.values(roleGlyphs)) {
      expect(VALID_GLYPH_KINDS).toContain(kind)
    }
  })
})

describe('content/experience/schools.ts', () => {
  it('every schoolMarks[].school equals an education[].school, and vice versa', () => {
    const markSchools = schoolMarks.map((mark) => mark.school).sort()
    const educationSchools = education.map((entry) => entry.school).sort()
    expect(markSchools).toEqual(educationSchools)
  })
})

describe('content/experience/glossary.ts', () => {
  it('every role key resolves to a real (company, title) pair in content/profile.ts', () => {
    const realKeys = new Set(roleEntries.map((entry) => entry.key))
    for (const key of Object.keys(highlightAnnotations)) {
      expect(realKeys.has(key), key).toBe(true)
    }
  })

  it('every match occurs exactly once in the résumé bullet it is keyed to', () => {
    for (const [key, byIndex] of Object.entries(highlightAnnotations)) {
      for (const [indexKey, annotations] of Object.entries(byIndex)) {
        const bullet = bulletFor(key, Number(indexKey))
        expect(bullet, `${key}[${indexKey}] has no matching résumé bullet`).toBeDefined()
        for (const annotation of annotations) {
          const occurrences = bullet!.split(annotation.match).length - 1
          expect(occurrences, `"${annotation.match}" in ${key}[${indexKey}]`).toBe(1)
        }
      }
    }
  })

  it('every techniqueId resolves to an id in content/techniques.ts', () => {
    const ids = new Set(techniques.map((note) => note.id))
    for (const byIndex of Object.values(highlightAnnotations)) {
      for (const annotations of Object.values(byIndex)) {
        for (const annotation of annotations) {
          expect(ids.has(annotation.techniqueId), annotation.techniqueId).toBe(true)
        }
      }
    }
  })

  it('declares exactly 4 annotated bullets and exactly 5 annotations in total', () => {
    let bulletCount = 0
    let annotationCount = 0
    for (const byIndex of Object.values(highlightAnnotations)) {
      for (const annotations of Object.values(byIndex)) {
        bulletCount += 1
        annotationCount += annotations.length
      }
    }
    expect(bulletCount).toBe(4)
    expect(annotationCount).toBe(5)
  })

  it('declares nothing for the tool-only Whiterock.ai role or the k-means ProMarketingHub role', () => {
    expect(highlightAnnotations['Whiterock.ai|Data Scientist']).toBeUndefined()
    expect(highlightAnnotations['ProMarketingHub|Junior Data Scientist']).toBeUndefined()
  })

  it('splitHighlight reproduces every annotated bullet exactly, gaining no character', () => {
    for (const [key, byIndex] of Object.entries(highlightAnnotations)) {
      for (const [indexKey, annotations] of Object.entries(byIndex)) {
        const bullet = bulletFor(key, Number(indexKey))!
        const rebuilt = splitHighlight(bullet, annotations)
          .map((segment) => segment.text)
          .join('')
        expect(rebuilt).toBe(bullet)
      }
    }
  })
})

describe('content/experience/intro.ts', () => {
  const NUMERAL = /\d[\d.,+]*/g

  it('every numeral in the paragraph appears verbatim in content/profile.ts', () => {
    const profileTokens = new Set(
      collectStrings({ profile, experience, education, skills }).join('\n').match(NUMERAL) ?? [],
    )
    const paragraphTokens = experienceIntro.paragraph.match(NUMERAL) ?? []
    expect(paragraphTokens.length).toBeGreaterThan(0)
    for (const token of paragraphTokens) {
      expect(profileTokens.has(token), token).toBe(true)
    }
  })

  it('contains no em dash and no apostrophe of either kind', () => {
    expect(experienceIntro.paragraph).not.toContain('\u2014') // em dash
    expect(experienceIntro.paragraph).not.toContain('\u2019') // typographic apostrophe
    expect(experienceIntro.paragraph).not.toContain("'") // straight apostrophe
  })

  it('heading and metaDescription are non-empty', () => {
    expect(experienceIntro.heading.trim().length).toBeGreaterThan(0)
    expect(experienceIntro.metaDescription.trim().length).toBeGreaterThan(0)
  })
})
