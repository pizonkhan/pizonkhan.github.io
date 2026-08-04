import type { SiteEnv } from './types'

const PROD_ORIGIN = 'https://pizonkhan.github.io'

/** wrangler.jsonc stores the allowlist as one comma-separated var. */
export function parseAllowedOrigins(raw: string): Set<string> {
  return new Set(
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

/**
 * Origin is a filter, not a security boundary: a non-browser client can forge it. It is
 * enough to keep an ordinary browser tab pointed at localhost out of the live numbers.
 */
export function classifyOrigin(
  origin: string | null,
  allowed: ReadonlySet<string>,
): { allowed: boolean; env: SiteEnv | null } {
  if (!origin || !allowed.has(origin)) return { allowed: false, env: null }
  return { allowed: true, env: origin === PROD_ORIGIN ? 'prod' : 'dev' }
}

/** Base CORS headers shared by every response. The caller adds status-specific ones. */
export function corsHeaders(origin: string | null, allowed: ReadonlySet<string>): Headers {
  const headers = new Headers()
  headers.set('vary', 'origin')
  if (origin && allowed.has(origin)) headers.set('access-control-allow-origin', origin)
  return headers
}
