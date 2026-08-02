/**
 * Pure helpers behind the inline concept links on /experience/. No React here: this file
 * knows how to split a string into plain and linked segments and how to key a role, and
 * nothing about what any of it looks like or means.
 */

export interface HighlightAnnotation {
  /**
   * An exact substring of the résumé bullet this annotation belongs to. Case sensitive.
   * Must occur exactly once in that bullet; content/experience/experience-content.test.ts
   * asserts it.
   */
  match: string
  /** A TechniqueNote id in content/techniques.ts. */
  techniqueId: string
}

export type HighlightSegment =
  | { kind: 'text'; text: string }
  | { kind: 'term'; text: string; techniqueId: string }

/**
 * Splits a résumé bullet into plain and linked segments without altering a character of it.
 * The concatenation of every returned segment's `text` equals `text` exactly, so a bullet can
 * gain a link without gaining or losing punctuation, spacing or casing.
 *
 * Rules, in order: an annotation whose `match` is absent is skipped, so an edit to
 * content/profile.ts degrades to plain text instead of crashing; annotations are applied at
 * their first occurrence only; matches are applied in ascending index order; an annotation
 * that overlaps one already applied is skipped.
 */
export function splitHighlight(
  text: string,
  annotations: readonly HighlightAnnotation[],
): HighlightSegment[] {
  interface AcceptedMatch {
    start: number
    end: number
    techniqueId: string
  }

  const accepted: AcceptedMatch[] = []

  for (const annotation of annotations) {
    const start = text.indexOf(annotation.match)
    if (start === -1) continue
    const end = start + annotation.match.length
    const overlapsAccepted = accepted.some((existing) => start < existing.end && end > existing.start)
    if (overlapsAccepted) continue
    accepted.push({ start, end, techniqueId: annotation.techniqueId })
  }

  accepted.sort((a, b) => a.start - b.start)

  const segments: HighlightSegment[] = []
  let cursor = 0
  for (const match of accepted) {
    if (match.start > cursor) {
      segments.push({ kind: 'text', text: text.slice(cursor, match.start) })
    }
    segments.push({ kind: 'term', text: text.slice(match.start, match.end), techniqueId: match.techniqueId })
    cursor = match.end
  }
  if (cursor < text.length) {
    segments.push({ kind: 'text', text: text.slice(cursor) })
  }
  if (segments.length === 0) {
    segments.push({ kind: 'text', text })
  }

  return segments
}

/**
 * The stable key for a role: `${company}|${title}`. content/profile.ts carries no id per role,
 * and this pair is unique across all five roles (the two "Data Scientist" titles sit at
 * different employers). experience-content.test.ts asserts uniqueness.
 */
export function roleKey(company: string, title: string): string {
  return `${company}|${title}`
}
