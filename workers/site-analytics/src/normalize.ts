import type { TargetKind } from './types'

/**
 * Server-side normalisation. The client sends already-normalised values, but a non-browser
 * client can send anything, so every value that ends up in a row is re-derived here rather
 * than trusted. This duplicates lib/analytics/normalize.ts on the site side by design: see
 * the StatsPayload note in the spec for why the boundary is not crossed with an import.
 */

const MAX_PATH = 128
const MAX_HREF = 200
const MAX_LABEL = 80
const SECTION_RE = /^[a-z0-9-]{1,40}$/

/**
 * '' -> '/'. Query and hash stripped. Lowercased. Repeated slashes collapsed.
 * Leading and trailing slash enforced. Capped at 128 characters.
 */
export function normalizePath(pathname: string): string {
  const cut = pathname.search(/[?#]/)
  let path = (cut === -1 ? pathname : pathname.slice(0, cut)).toLowerCase()
  path = path.replace(/\/{2,}/g, '/')
  if (!path.startsWith('/')) path = `/${path}`
  if (!path.endsWith('/')) path = `${path}/`
  if (path.length > MAX_PATH) path = path.slice(0, MAX_PATH)
  return path
}

/**
 * Returns null for an href the pipeline should ignore: empty, '#', 'javascript:',
 * or anything that fails to parse. Outbound hrefs keep origin + pathname and drop
 * search and hash. Internal hrefs are reduced to a normalised path. Anchors keep
 * the fragment. Capped at 200 characters.
 */
export function classifyHref(input: {
  href: string
  siteOrigin: string
  hasDownloadAttribute: boolean
}): { targetKind: TargetKind; href: string } | null {
  const raw = input.href.trim()
  if (!raw || raw === '#') return null
  const lower = raw.toLowerCase()
  if (lower.startsWith('javascript:')) return null
  if (raw.startsWith('#')) return { targetKind: 'anchor', href: raw.slice(0, MAX_HREF) }
  if (lower.startsWith('mailto:')) return { targetKind: 'mailto', href: raw.slice(0, MAX_HREF) }

  let url: URL
  if (raw.startsWith('/')) {
    try {
      url = new URL(raw, input.siteOrigin)
    } catch {
      return null
    }
  } else {
    try {
      url = new URL(raw)
    } catch {
      return null
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  }

  const sameOrigin = url.origin === input.siteOrigin
  if (input.hasDownloadAttribute) {
    const value = sameOrigin ? normalizePath(url.pathname) : `${url.origin}${url.pathname}`
    return { targetKind: 'download', href: value.slice(0, MAX_HREF) }
  }
  if (sameOrigin) return { targetKind: 'internal', href: normalizePath(url.pathname) }
  return { targetKind: 'outbound', href: `${url.origin}${url.pathname}`.slice(0, MAX_HREF) }
}

/** '' -> 'direct'. Same origin -> 'internal'. Otherwise hostname, lowercased, 'www.' stripped. */
export function referrerHost(documentReferrer: string, siteOrigin: string): string {
  const raw = documentReferrer.trim()
  if (!raw) return 'direct'
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'direct'
  }
  if (url.origin === siteOrigin) return 'internal'
  return url.hostname.toLowerCase().replace(/^www\./, '')
}

/** Collapsed whitespace, trimmed, capped at 80 characters. '' when nothing usable. */
export function normalizeLabel(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL)
}

/** True when a click's section string is well formed: [a-z0-9-]{1,40}. */
export function isValidSection(section: string): boolean {
  return SECTION_RE.test(section)
}

/**
 * Validates a duration already expressed in whole seconds by the client, and clamps its
 * upper end. Returns null when the value is not a usable positive duration.
 */
export function clampDurationSeconds(seconds: number): number | null {
  if (!Number.isFinite(seconds)) return null
  const whole = Math.floor(seconds)
  if (whole < 1) return null
  return Math.min(whole, 3600)
}
