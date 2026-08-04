import { describe, expect, it } from 'vitest'
import { classifyHref, normalizePath, referrerHost } from '../src/normalize'

const SITE_ORIGIN = 'https://pizonkhan.github.io'

describe('normalizePath', () => {
  it('maps empty and root to /', () => {
    expect(normalizePath('')).toBe('/')
    expect(normalizePath('/')).toBe('/')
  })

  it('lowercases and enforces a trailing slash', () => {
    expect(normalizePath('/Projects')).toBe('/projects/')
  })

  it('strips query and hash and collapses repeated slashes', () => {
    expect(normalizePath('/projects//nyc?a=1#x')).toBe('/projects/nyc/')
  })

  it('caps length at 128 characters', () => {
    const long = `/${'a'.repeat(300)}`
    const result = normalizePath(long)
    expect(result.length).toBe(128)
  })
})

describe('classifyHref', () => {
  const base = { siteOrigin: SITE_ORIGIN, hasDownloadAttribute: false }

  it('returns null for empty, hash-only, javascript and unparseable hrefs', () => {
    expect(classifyHref({ ...base, href: '' })).toBeNull()
    expect(classifyHref({ ...base, href: '#' })).toBeNull()
    expect(classifyHref({ ...base, href: 'javascript:void(0)' })).toBeNull()
    expect(classifyHref({ ...base, href: 'not a url' })).toBeNull()
  })

  it('strips search and hash for outbound links', () => {
    const result = classifyHref({ ...base, href: 'https://data.cityofnewyork.us/x?a=1#b' })
    expect(result).toEqual({ targetKind: 'outbound', href: 'https://data.cityofnewyork.us/x' })
  })

  it('classifies same-origin links as internal', () => {
    expect(classifyHref({ ...base, href: `${SITE_ORIGIN}/business/` })).toEqual({
      targetKind: 'internal',
      href: '/business/',
    })
    expect(classifyHref({ ...base, href: '/experience/' })).toEqual({
      targetKind: 'internal',
      href: '/experience/',
    })
  })

  it('classifies a hash-prefixed href as an anchor', () => {
    expect(classifyHref({ ...base, href: '#models' })).toEqual({ targetKind: 'anchor', href: '#models' })
  })

  it('classifies a mailto href as mailto', () => {
    expect(classifyHref({ ...base, href: 'mailto:someone@example.com' })).toEqual({
      targetKind: 'mailto',
      href: 'mailto:someone@example.com',
    })
  })

  it('classifies download when the download attribute is present', () => {
    const result = classifyHref({
      siteOrigin: SITE_ORIGIN,
      hasDownloadAttribute: true,
      href: 'https://example.com/resume.pdf',
    })
    expect(result).toEqual({ targetKind: 'download', href: 'https://example.com/resume.pdf' })
  })
})

describe('referrerHost', () => {
  it('maps empty to direct', () => {
    expect(referrerHost('', SITE_ORIGIN)).toBe('direct')
  })

  it('maps a same-origin referrer to internal', () => {
    expect(referrerHost(`${SITE_ORIGIN}/projects/`, SITE_ORIGIN)).toBe('internal')
  })

  it('strips www from a foreign host', () => {
    expect(referrerHost('https://www.linkedin.com/feed/', SITE_ORIGIN)).toBe('linkedin.com')
  })
})
