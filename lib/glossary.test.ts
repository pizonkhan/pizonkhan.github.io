import { describe, expect, it } from 'vitest'
import { roleKey, splitHighlight, type HighlightAnnotation } from './glossary'

describe('splitHighlight', () => {
  it('returns the whole string as one text segment when there are no annotations', () => {
    const text = 'a plain sentence with no terms in it'
    expect(splitHighlight(text, [])).toEqual([{ kind: 'text', text }])
  })

  it('splits a single match into a leading text segment, a term, and a trailing text segment', () => {
    const text = 'built ETL processes and ran k-means clustering on the data'
    const annotations: HighlightAnnotation[] = [{ match: 'k-means clustering', techniqueId: 'k-means' }]
    expect(splitHighlight(text, annotations)).toEqual([
      { kind: 'text', text: 'built ETL processes and ran ' },
      { kind: 'term', text: 'k-means clustering', techniqueId: 'k-means' },
      { kind: 'text', text: ' on the data' },
    ])
  })

  it('splits two non-overlapping matches in one string into five segments', () => {
    const text = 'used PD and LGD models with weights of evidence binning'
    const annotations: HighlightAnnotation[] = [
      { match: 'PD and LGD models', techniqueId: 'pd-lgd' },
      { match: 'weights of evidence', techniqueId: 'woe' },
    ]
    expect(splitHighlight(text, annotations)).toEqual([
      { kind: 'text', text: 'used ' },
      { kind: 'term', text: 'PD and LGD models', techniqueId: 'pd-lgd' },
      { kind: 'text', text: ' with ' },
      { kind: 'term', text: 'weights of evidence', techniqueId: 'woe' },
      { kind: 'text', text: ' binning' },
    ])
  })

  it('drops the leading text segment when the match starts at index 0', () => {
    const text = 'k-nearest-neighbor clustering imputed the gaps'
    const annotations: HighlightAnnotation[] = [
      { match: 'k-nearest-neighbor clustering', techniqueId: 'knn' },
    ]
    const segments = splitHighlight(text, annotations)
    expect(segments).toEqual([
      { kind: 'term', text: 'k-nearest-neighbor clustering', techniqueId: 'knn' },
      { kind: 'text', text: ' imputed the gaps' },
    ])
  })

  it('drops the trailing text segment when the match ends the string', () => {
    const text = 'the gaps were filled by k-nearest-neighbor clustering'
    const annotations: HighlightAnnotation[] = [
      { match: 'k-nearest-neighbor clustering', techniqueId: 'knn' },
    ]
    const segments = splitHighlight(text, annotations)
    expect(segments).toEqual([
      { kind: 'text', text: 'the gaps were filled by ' },
      { kind: 'term', text: 'k-nearest-neighbor clustering', techniqueId: 'knn' },
    ])
  })

  it('skips an annotation whose match is absent, degrading to a single plain-text segment', () => {
    const text = 'a sentence that never mentions the annotated phrase'
    const annotations: HighlightAnnotation[] = [{ match: 'does not appear', techniqueId: 'missing' }]
    expect(splitHighlight(text, annotations)).toEqual([{ kind: 'text', text }])
  })

  it('skips a later annotation whose match overlaps one already applied', () => {
    const text = 'point-in-time snapshots of the table'
    const annotations: HighlightAnnotation[] = [
      { match: 'point-in-time snapshots', techniqueId: 'pit' },
      { match: 'time snapshots of', techniqueId: 'overlap' },
    ]
    expect(splitHighlight(text, annotations)).toEqual([
      { kind: 'term', text: 'point-in-time snapshots', techniqueId: 'pit' },
      { kind: 'text', text: ' of the table' },
    ])
  })

  it('applies only the first occurrence when a match occurs twice', () => {
    const text = 'a fox and a fox ran past'
    const annotations: HighlightAnnotation[] = [{ match: 'a fox', techniqueId: 'fox' }]
    expect(splitHighlight(text, annotations)).toEqual([
      { kind: 'term', text: 'a fox', techniqueId: 'fox' },
      { kind: 'text', text: ' and a fox ran past' },
    ])
  })

  it('never alters a character: the concatenated segment text equals the input exactly', () => {
    const cases: Array<[string, HighlightAnnotation[]]> = [
      ['a plain sentence with no terms in it', []],
      [
        'built ETL processes and ran k-means clustering on the data',
        [{ match: 'k-means clustering', techniqueId: 'k-means' }],
      ],
      [
        'used PD and LGD models with weights of evidence binning',
        [
          { match: 'PD and LGD models', techniqueId: 'pd-lgd' },
          { match: 'weights of evidence', techniqueId: 'woe' },
        ],
      ],
      ['a fox and a fox ran past', [{ match: 'a fox', techniqueId: 'fox' }]],
      [
        'point-in-time snapshots of the table',
        [
          { match: 'point-in-time snapshots', techniqueId: 'pit' },
          { match: 'time snapshots of', techniqueId: 'overlap' },
        ],
      ],
    ]
    for (const [text, annotations] of cases) {
      const segments = splitHighlight(text, annotations)
      expect(segments.map((segment) => segment.text).join('')).toBe(text)
    }
  })
})

describe('roleKey', () => {
  it('joins company and title with a pipe', () => {
    expect(roleKey('Webster Bank', 'Director, Credit Analytics')).toBe(
      'Webster Bank|Director, Credit Analytics',
    )
  })

  it('gives the same title at two different employers two distinct keys', () => {
    expect(roleKey('Webster Bank', 'Data Scientist')).not.toBe(roleKey('Whiterock.ai', 'Data Scientist'))
  })
})
