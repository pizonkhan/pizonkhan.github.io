import { describe, expect, it } from 'vitest'
import {
  classifyHref,
  normalizeDuration,
  normalizeLabel,
  normalizePath,
  pickSection,
  referrerHost,
  type AncestorNode,
} from './normalize'

const SITE_ORIGIN = 'https://pizonkhan.github.io'

describe('normalizePath', () => {
  it('maps the empty string to /', () => {
    expect(normalizePath('')).toBe('/')
  })

  it('leaves / as /', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('lowercases and adds a trailing slash', () => {
    expect(normalizePath('/Projects')).toBe('/projects/')
  })

  it('strips query and hash and collapses repeated slashes', () => {
    expect(normalizePath('/projects//nyc?a=1#x')).toBe('/projects/nyc/')
  })

  it('caps a very long path at 128 characters', () => {
    const long = '/' + 'a'.repeat(300)
    const result = normalizePath(long)
    expect(result.length).toBe(128)
  })
})

describe('classifyHref', () => {
  const base = { siteOrigin: SITE_ORIGIN, hasDownloadAttribute: false }

  it('returns null for empty, #, javascript: and unparsable hrefs', () => {
    expect(classifyHref({ href: '', ...base })).toBeNull()
    expect(classifyHref({ href: '#', ...base })).toBeNull()
    expect(classifyHref({ href: 'javascript:void(0)', ...base })).toBeNull()
    expect(classifyHref({ href: 'not a url', ...base })).toBeNull()
  })

  it('returns outbound with search and hash stripped', () => {
    expect(classifyHref({ href: 'https://data.cityofnewyork.us/x?a=1#b', ...base })).toEqual({
      targetKind: 'outbound',
      href: 'https://data.cityofnewyork.us/x',
    })
  })

  it('returns internal for a same-origin absolute URL and for a site-relative path', () => {
    expect(classifyHref({ href: `${SITE_ORIGIN}/experience/`, ...base })).toEqual({
      targetKind: 'internal',
      href: '/experience/',
    })
    expect(classifyHref({ href: '/experience/', ...base })).toEqual({
      targetKind: 'internal',
      href: '/experience/',
    })
  })

  it('returns anchor for a fragment href', () => {
    expect(classifyHref({ href: '#models', ...base })).toEqual({ targetKind: 'anchor', href: '#models' })
  })

  it('returns mailto for a mailto: href', () => {
    expect(classifyHref({ href: 'mailto:test@example.com', ...base })).toEqual({
      targetKind: 'mailto',
      href: 'mailto:test@example.com',
    })
  })

  it('returns download when the download attribute is present', () => {
    expect(
      classifyHref({ href: 'https://example.com/file.pdf', siteOrigin: SITE_ORIGIN, hasDownloadAttribute: true }),
    ).toEqual({ targetKind: 'download', href: 'https://example.com/file.pdf' })
  })
})

describe('referrerHost', () => {
  it('maps the empty string to direct', () => {
    expect(referrerHost('', SITE_ORIGIN)).toBe('direct')
  })

  it('maps a same-origin URL to internal', () => {
    expect(referrerHost(`${SITE_ORIGIN}/projects/`, SITE_ORIGIN)).toBe('internal')
  })

  it('reduces a referrer to its bare host, stripping www.', () => {
    expect(referrerHost('https://www.linkedin.com/feed/', SITE_ORIGIN)).toBe('linkedin.com')
  })
})

describe('normalizeLabel', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeLabel('  NYC   Department  \n of Finance ')).toBe('NYC Department of Finance')
  })

  it('returns empty for null or undefined', () => {
    expect(normalizeLabel(null)).toBe('')
    expect(normalizeLabel(undefined)).toBe('')
  })
})

describe('normalizeDuration', () => {
  it('rounds to whole seconds', () => {
    expect(normalizeDuration(9_500)).toBe(10)
  })

  it('drops anything under 1 second', () => {
    expect(normalizeDuration(400)).toBeNull()
  })

  it('clamps at 3600 seconds', () => {
    expect(normalizeDuration(4_000_000)).toBe(3600)
  })
})

describe('pickSection', () => {
  const div = (extra: Partial<AncestorNode> = {}): AncestorNode => ({ tag: 'div', ...extra })

  it('returns the nearest data-section', () => {
    const chain: AncestorNode[] = [
      div({ dataSection: 'hero' }),
      { tag: 'section', id: 'other', dataSection: null },
    ]
    expect(pickSection(chain)).toBe('hero')
  })

  it('falls back to the nearest landmark tag with an id', () => {
    const chain: AncestorNode[] = [div(), div(), { tag: 'section', id: 'contact' }]
    expect(pickSection(chain)).toBe('contact')
  })

  it('returns unknown for a chain of plain divs', () => {
    const chain: AncestorNode[] = [div(), div(), div()]
    expect(pickSection(chain)).toBe('unknown')
  })

  it('lowercases and strips a mixed-case id down to [a-z0-9-]', () => {
    const chain: AncestorNode[] = [{ tag: 'header', id: 'Site_Header!' }]
    expect(pickSection(chain)).toBe('siteheader')
  })

  it('truncates a 60-character section name to 40', () => {
    const long = 'a'.repeat(60)
    const chain: AncestorNode[] = [div({ dataSection: long })]
    expect(pickSection(chain)).toBe('a'.repeat(40))
  })
})
