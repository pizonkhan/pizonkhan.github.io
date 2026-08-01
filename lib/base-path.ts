/**
 * Every asset URL in the app goes through here. Hardcoding `/img/foo.png` works on a
 * user site and silently 404s anywhere served from a subpath, so the helper is the
 * single place that knows the difference.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const ABSOLUTE = /^[a-z][a-z0-9+.-]*:/i

export function withBasePath(path: string): string {
  // Leave absolute URLs, protocol-relative URLs and data: URIs alone.
  if (ABSOLUTE.test(path) || path.startsWith('//')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_PATH}${normalized}`
}
