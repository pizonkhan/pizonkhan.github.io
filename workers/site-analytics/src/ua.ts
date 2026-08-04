/**
 * The raw user agent is read here and nowhere else. Every export returns a small enum or a
 * boolean, and the caller discards the raw string immediately after calling these.
 */

export type Browser = 'chrome' | 'safari' | 'firefox' | 'edge' | 'opera' | 'other'
export type Device = 'mobile' | 'tablet' | 'desktop' | 'unknown'

/** Edge before Chrome, Chrome before Safari: every real Chromium UA also matches the others. */
export function classifyBrowser(userAgent: string): Browser {
  if (!userAgent) return 'other'
  if (/Edg\//.test(userAgent)) return 'edge'
  if (/OPR\//.test(userAgent) || /\bOpera\b/.test(userAgent)) return 'opera'
  if (/Chrome\//.test(userAgent)) return 'chrome'
  if (/Firefox\//.test(userAgent)) return 'firefox'
  if (/Safari\//.test(userAgent)) return 'safari'
  return 'other'
}

export function classifyDevice(input: { userAgent: string; secChUaMobile?: string }): Device {
  if (input.secChUaMobile === '?1') return 'mobile'
  const ua = input.userAgent
  if (!ua) return 'unknown'
  if (/iPad/.test(ua)) return 'tablet'
  if (/iPhone|iPod/.test(ua)) return 'mobile'
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'mobile' : 'tablet'
  if (/Mobile|Tablet/.test(ua)) return 'mobile'
  return 'desktop'
}

const BOT_PATTERNS: readonly RegExp[] = [
  /googlebot/i,
  /curl\//i,
  /python-requests/i,
  /headlesschrome/i,
  /lighthouse/i,
  /bingbot/i,
]

export function isBot(userAgent: string): boolean {
  if (!userAgent) return true
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent))
}
