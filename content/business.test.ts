import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { business } from './business'

/**
 * Content-integrity guards for the /business/ route (acceptance criteria 6 to 13 in
 * docs/plans/business-page-and-landing-section.md). These check the facts and the copy, not
 * rendering: the geometry file has its own test, and the rendered page is checked separately by
 * grepping the built export.
 */

const SOURCE = readFileSync(path.resolve(__dirname, 'business.ts'), 'utf8')

const FORBIDDEN_STRINGS = [
  'github',
  'ARR',
  'bookings/day',
  'bookings per day',
  '40+',
  '10k+',
  '30+ years',
  'LLC',
  'EIN',
  'Zelle',
  '@newyorklimo',
]

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out)
  }
  return out
}

const allStrings = collectStrings(business)
const allText = allStrings.join('\n')

describe('content/business.ts content integrity', () => {
  it('never mentions the source repository, forbidden stats, or private business detail', () => {
    for (const forbidden of FORBIDDEN_STRINGS) {
      expect(allText.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
  })

  it('has no em dash anywhere in the source file', () => {
    expect(SOURCE).not.toMatch(/—/)
  })

  it('every http URL is https and points at one of the two allowed hosts', () => {
    const urls = allStrings.filter((value) => /^https?:\/\//.test(value))
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      const parsed = new URL(url)
      expect(parsed.protocol).toBe('https:')
      expect(['newyorklimo-web.vercel.app', 'newyorklimo.net']).toContain(parsed.hostname)
    }
  })

  it('states Anthropic’s Claude API plainly, both in prose and as a stack item', () => {
    expect(business.assistant.body.join(' ')).toContain('Anthropic')
    expect(business.stack.items).toContain('Anthropic Claude API')
  })

  it('uses both sourcing markers, repeatedly, following the content/profile.ts precedent', () => {
    const repoMarkers = SOURCE.match(/\/\/ Repo:/g) ?? []
    const confirmedMarkers = SOURCE.match(/\/\/ Confirmed directly by Pizon:/g) ?? []
    expect(repoMarkers.length).toBeGreaterThan(5)
    expect(confirmedMarkers.length).toBeGreaterThan(2)
  })

  it('the header block states the never-appear list', () => {
    expect(SOURCE).toContain('WHAT MAY NEVER APPEAR HERE')
    expect(SOURCE).toContain('The legal entity name, phone number, business address, EIN')
  })
})

describe('content/business.ts data shape', () => {
  it('pricing.flow has exactly three steps, unique ids, and no dollar amount or fare line item', () => {
    expect(business.pricing.flow.steps).toHaveLength(3)
    const ids = business.pricing.flow.steps.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const step of business.pricing.flow.steps) {
      expect(step.title.trim().length).toBeGreaterThan(0)
      expect(step.body.trim().length).toBeGreaterThan(0)
      expect(step.body).not.toMatch(/\$[0-9]|Base fare|Gratuity|Tolls/)
    }
  })

  it('has exactly three figures, each with a non-empty source', () => {
    expect(business.figures).toHaveLength(3)
    for (const figure of business.figures) {
      expect(figure.source.trim().length).toBeGreaterThan(0)
    }
  })

  it('has exactly three audiences with unique ids and a valid glyph kind', () => {
    const validGlyphs = ['route', 'sedan', 'board', 'handoff']
    expect(business.platform.audiences).toHaveLength(3)
    const ids = business.platform.audiences.map((audience) => audience.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const audience of business.platform.audiences) {
      expect(validGlyphs).toContain(audience.glyph)
    }
  })

  it('has exactly six portal capabilities with unique ids', () => {
    expect(business.portal.capabilities).toHaveLength(6)
    const ids = business.portal.capabilities.map((capability) => capability.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('landing.body is at most 70 words', () => {
    const wordCount = business.landing.body.trim().split(/\s+/).length
    expect(wordCount).toBeLessThanOrEqual(70)
  })
})
