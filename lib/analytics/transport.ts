/**
 * Fire and forget. Never throws, never rejects, never logs. A blocked or unreachable
 * endpoint is a no-op, not an error the visitor can see.
 *
 * The body is a plain string, so sendBeacon sends it as text/plain;charset=UTF-8, which is
 * a CORS-safelisted content type and therefore needs no preflight. A JSON content type
 * would force an OPTIONS round trip and double the request count.
 */
export function send(url: string, payload: unknown, options?: { beacon?: boolean }): void {
  if (!url) return
  try {
    const body = JSON.stringify(payload)

    if (options?.beacon && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon(url, body)) return
    }

    fetch(url, {
      method: 'POST',
      body,
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    }).catch(() => {})
  } catch {
    // A blocked endpoint, a malformed payload or a missing fetch must never surface here.
  }
}
