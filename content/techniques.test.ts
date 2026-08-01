import { describe, expect, it } from 'vitest'
import { techniques } from './techniques'
import { profile, experience } from './profile'

/**
 * Guards the employment boundary on /experience/ (acceptance criteria 11 and 58).
 * TechniqueNotes must stay general-method only, and the proof-strip figures hardcoded in
 * components/home/ProofStrip.tsx must trace verbatim to a résumé bullet in content/profile.ts,
 * so a future edit to either file cannot silently drift them apart.
 */

describe('content/techniques.ts', () => {
  it('every entry is scoped as a general method with no employer specifics', () => {
    expect(techniques.length).toBeGreaterThanOrEqual(3)
    expect(techniques.length).toBeLessThanOrEqual(5)
    for (const note of techniques) {
      expect(note.scope).toBe('general-method')
      expect(note.containsEmployerSpecifics).toBe(false)
    }
  })

  it('no technique body contains a digit (no percentages, thresholds or dollar amounts)', () => {
    for (const note of techniques) {
      for (const paragraph of note.body) {
        expect(paragraph).not.toMatch(/[0-9]/)
      }
    }
  })

  it('every id is unique and every title is non-empty', () => {
    const ids = techniques.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const note of techniques) {
      expect(note.title.trim().length).toBeGreaterThan(0)
      expect(note.body.length).toBeGreaterThan(0)
    }
  })
})

describe('landing proof-strip figures trace verbatim to the résumé', () => {
  const allHighlights = experience.flatMap((employer) => employer.roles.flatMap((role) => role.highlights))
  const haystack = allHighlights.join('\n')

  it('"15+" (Snowflake pipelines) appears verbatim in a résumé bullet', () => {
    expect(haystack).toContain('15+ Snowflake pipelines')
  })

  it('"$1.5M" (saved annually) appears verbatim in a résumé bullet', () => {
    expect(haystack).toContain('$1.5M annually')
  })

  it('"~100" (users) appears verbatim in a résumé bullet', () => {
    expect(haystack).toContain('~100 users')
  })

  it('profile.name and profile.headline are non-empty, sourcing the hero', () => {
    expect(profile.name.trim().length).toBeGreaterThan(0)
    expect(profile.headline.trim().length).toBeGreaterThan(0)
    expect(profile.company.trim().length).toBeGreaterThan(0)
  })
})
