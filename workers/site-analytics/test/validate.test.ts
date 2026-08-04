import { describe, expect, it } from 'vitest'
import { validateCollectBody } from '../src/validate'

const ORIGIN = 'https://pizonkhan.github.io'
const ID_A = 'a'.repeat(32)
const ID_B = 'b'.repeat(32)
const ID_C = 'c'.repeat(32)
const VISIT = 'd'.repeat(32)

function body(events: unknown[]): string {
  return JSON.stringify({ v: 1, events })
}

describe('validateCollectBody', () => {
  it('accepts a well-formed body with one of each event kind', () => {
    const result = validateCollectBody(
      body([
        { id: ID_A, visit: VISIT, kind: 'pageview', path: '/projects/' },
        {
          id: ID_B,
          visit: VISIT,
          kind: 'click',
          path: '/projects/',
          targetKind: 'internal',
          href: '/experience/',
        },
        { id: ID_C, visit: VISIT, kind: 'duration', path: '/projects/', seconds: 42 },
      ]),
      ORIGIN,
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.events).toHaveLength(3)
  })

  it('rejects a non-JSON body', () => {
    const result = validateCollectBody('not json', ORIGIN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('invalid_body')
  })

  it('rejects v: 2', () => {
    const result = validateCollectBody(JSON.stringify({ v: 2, events: [] }), ORIGIN)
    expect(result.ok).toBe(false)
  })

  it('rejects a missing events field', () => {
    const result = validateCollectBody(JSON.stringify({ v: 1 }), ORIGIN)
    expect(result.ok).toBe(false)
  })

  it('rejects an empty events array', () => {
    const result = validateCollectBody(body([]), ORIGIN)
    expect(result.ok).toBe(false)
  })

  it('rejects 21 events', () => {
    const events = Array.from({ length: 21 }, () => ({
      id: ID_A,
      visit: VISIT,
      kind: 'pageview',
      path: '/',
    }))
    const result = validateCollectBody(body(events), ORIGIN)
    expect(result.ok).toBe(false)
  })

  it('rejects an unknown kind', () => {
    const result = validateCollectBody(body([{ id: ID_A, visit: VISIT, kind: 'scroll', path: '/' }]), ORIGIN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('invalid_event')
  })

  it('rejects an id that is not 32 hex characters', () => {
    const result = validateCollectBody(
      body([{ id: 'not-hex', visit: VISIT, kind: 'pageview', path: '/' }]),
      ORIGIN,
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a visit that is not 32 hex characters', () => {
    const result = validateCollectBody(
      body([{ id: ID_A, visit: 'short', kind: 'pageview', path: '/' }]),
      ORIGIN,
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a duration of 0 seconds', () => {
    const result = validateCollectBody(
      body([{ id: ID_A, visit: VISIT, kind: 'duration', path: '/', seconds: 0 }]),
      ORIGIN,
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a duration of -5 seconds', () => {
    const result = validateCollectBody(
      body([{ id: ID_A, visit: VISIT, kind: 'duration', path: '/', seconds: -5 }]),
      ORIGIN,
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a targetKind outside the five', () => {
    const result = validateCollectBody(
      body([
        {
          id: ID_A,
          visit: VISIT,
          kind: 'click',
          path: '/',
          targetKind: 'social',
          href: '/experience/',
        },
      ]),
      ORIGIN,
    )
    expect(result.ok).toBe(false)
  })

  it('rejects a section containing an uppercase letter', () => {
    const result = validateCollectBody(
      body([
        {
          id: ID_A,
          visit: VISIT,
          kind: 'click',
          path: '/',
          targetKind: 'internal',
          href: '/experience/',
          section: 'Hero',
        },
      ]),
      ORIGIN,
    )
    expect(result.ok).toBe(false)
  })

  it('clamps seconds: 99999 to 3600 rather than rejecting it', () => {
    const result = validateCollectBody(
      body([{ id: ID_A, visit: VISIT, kind: 'duration', path: '/', seconds: 99999 }]),
      ORIGIN,
    )
    expect(result.ok).toBe(true)
    if (result.ok && result.events[0].kind === 'duration') {
      expect(result.events[0].durationSeconds).toBe(3600)
    }
  })

  it('stores an unknown path as /unknown and preserves a known one', () => {
    const result = validateCollectBody(
      body([
        { id: ID_A, visit: VISIT, kind: 'pageview', path: '/not-a-real-route/' },
        { id: ID_B, visit: VISIT, kind: 'pageview', path: '/experience/' },
      ]),
      ORIGIN,
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.events[0].path).toBe('/unknown')
      expect(result.events[1].path).toBe('/experience/')
    }
  })
})
