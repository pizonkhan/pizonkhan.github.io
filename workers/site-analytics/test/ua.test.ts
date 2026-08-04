import { describe, expect, it } from 'vitest'
import { classifyBrowser, classifyDevice, isBot } from '../src/ua'

const CHROME_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
const SAFARI_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const FIREFOX_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0'
const EDGE_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'
const OPERA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 OPR/114.0.0.0'
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15'
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15'

describe('classifyBrowser', () => {
  it('resolves Edge before Chrome, and Chrome before Safari', () => {
    expect(classifyBrowser(EDGE_DESKTOP)).toBe('edge')
    expect(classifyBrowser(CHROME_DESKTOP)).toBe('chrome')
    expect(classifyBrowser(SAFARI_DESKTOP)).toBe('safari')
  })

  it('classifies Firefox and Opera', () => {
    expect(classifyBrowser(FIREFOX_DESKTOP)).toBe('firefox')
    expect(classifyBrowser(OPERA_DESKTOP)).toBe('opera')
  })

  it('falls back to other', () => {
    expect(classifyBrowser('some unrecognised client/1.0')).toBe('other')
    expect(classifyBrowser('')).toBe('other')
  })
})

describe('classifyDevice', () => {
  it('trusts the client hint regardless of user agent', () => {
    expect(classifyDevice({ userAgent: CHROME_DESKTOP, secChUaMobile: '?1' })).toBe('mobile')
  })

  it('classifies an iPhone UA with no client hint as mobile', () => {
    expect(classifyDevice({ userAgent: IPHONE_UA })).toBe('mobile')
  })

  it('classifies an iPad UA as tablet', () => {
    expect(classifyDevice({ userAgent: IPAD_UA })).toBe('tablet')
  })

  it('classifies a plain desktop UA as desktop', () => {
    expect(classifyDevice({ userAgent: CHROME_DESKTOP })).toBe('desktop')
  })

  it('classifies an empty user agent as unknown', () => {
    expect(classifyDevice({ userAgent: '' })).toBe('unknown')
  })
})

describe('isBot', () => {
  it('is true for an empty user agent', () => {
    expect(isBot('')).toBe(true)
  })

  it('is true for known crawler and tooling user agents', () => {
    expect(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true)
    expect(isBot('curl/8.4.0')).toBe(true)
    expect(isBot('python-requests/2.31.0')).toBe(true)
    expect(isBot('Mozilla/5.0 HeadlessChrome/128.0.0.0 Safari/537.36')).toBe(true)
    expect(isBot('Mozilla/5.0 (compatible; Lighthouse/12.0.0)')).toBe(true)
    expect(isBot('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true)
  })

  it('is false for the six real browser user agents', () => {
    for (const ua of [CHROME_DESKTOP, SAFARI_DESKTOP, FIREFOX_DESKTOP, EDGE_DESKTOP, OPERA_DESKTOP, IPHONE_UA]) {
      expect(isBot(ua)).toBe(false)
    }
  })
})
