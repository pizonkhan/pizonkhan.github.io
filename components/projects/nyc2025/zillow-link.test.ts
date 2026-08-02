import { describe, expect, it } from 'vitest'
import { zillowSearchUrl } from './zillow-link'

describe('zillowSearchUrl', () => {
  it('builds a Zillow homes search URL from an address and a zip', () => {
    const url = zillowSearchUrl('132-05 89 AVENUE', '11418')
    expect(url).toBe('https://www.zillow.com/homes/132-05%2089%20AVENUE%2C%20NY%2011418_rb/')
  })

  it('trims whitespace off both inputs before building the URL', () => {
    const url = zillowSearchUrl('  3 HANOVER SQUARE  ', '  10004  ')
    expect(url).toBe(zillowSearchUrl('3 HANOVER SQUARE', '10004'))
  })

  it('returns null when the address is empty', () => {
    expect(zillowSearchUrl('', '10004')).toBeNull()
    expect(zillowSearchUrl('   ', '10004')).toBeNull()
  })

  it('always lands on zillow.com and ends in the search-page suffix', () => {
    const url = zillowSearchUrl('1 MAIN STREET', '10001')
    if (!url) throw new Error('expected zillowSearchUrl to return a URL')
    expect(new URL(url).host).toBe('www.zillow.com')
    expect(url).toMatch(/_rb\/$/)
  })
})
