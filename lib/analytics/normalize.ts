/**
 * Pure normalisation used by lib/analytics/tracker.ts. Every export takes primitives, so
 * this is unit-testable in the root node environment with no jsdom. DOM traversal itself
 * stays in tracker.ts; this module only shapes the values once they are pulled out.
 *
 * This deliberately duplicates the ingestion worker's own copy of the same functions rather
 * than sharing an import across the repo boundary. See the StatsPayload note in the spec for
 * why: the worker's tsconfig must never enter the site's type graph.
 */

export type TargetKind = 'internal' | 'outbound' | 'anchor' | 'mailto' | 'download'

const MAX_PATH = 128
const MAX_HREF = 200
const MAX_LABEL = 80
const MAX_SECTION = 40
const SECTION_LANDMARK_TAGS = new Set(['section', 'article', 'header', 'footer', 'main', 'nav'])

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
 * Returns null for an href the tracker should ignore: empty, '#', 'javascript:',
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

/** Ancestor chain, nearest first, as plain data so this is testable without a DOM. */
export interface AncestorNode {
  dataSection?: string | null
  tag: string
  id?: string | null
}

function sanitizeSection(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, MAX_SECTION)
}

/**
 * First ancestor carrying data-section wins. Failing that, the first ancestor that is a
 * section, article, header, footer, main or nav with an id, using that id. Failing that,
 * 'unknown'. The result is lowercased and reduced to [a-z0-9-], capped at 40 characters.
 */
export function pickSection(chain: readonly AncestorNode[]): string {
  for (const node of chain) {
    if (node.dataSection) {
      const cleaned = sanitizeSection(node.dataSection)
      if (cleaned) return cleaned
    }
  }
  for (const node of chain) {
    if (node.id && SECTION_LANDMARK_TAGS.has(node.tag.toLowerCase())) {
      const cleaned = sanitizeSection(node.id)
      if (cleaned) return cleaned
    }
  }
  return 'unknown'
}

/** Collapsed whitespace, trimmed, capped at 80 characters. '' when nothing usable. */
export function normalizeLabel(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL)
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

/** Rounds to whole seconds, drops anything under 1, clamps at 3600. Returns null when dropped. */
export function normalizeDuration(ms: number): number | null {
  if (!Number.isFinite(ms) || ms <= 0) return null
  const seconds = Math.round(ms / 1000)
  if (seconds < 1) return null
  return Math.min(seconds, 3600)
}
