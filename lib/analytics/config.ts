/**
 * The analytics endpoint and the two gates that keep local traffic out of the live numbers.
 * The endpoint is a public URL, not a secret: it is baked into the client bundle by design.
 */
export const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT ?? ''

/** The only hostname allowed to emit events. A locally served copy of out/ is not on it. */
export const TRACKED_HOSTS: readonly string[] = ['pizonkhan.github.io']

export const COLLECT_URL = ANALYTICS_ENDPOINT ? `${ANALYTICS_ENDPOINT}/collect` : ''
export const STATS_URL = ANALYTICS_ENDPOINT ? `${ANALYTICS_ENDPOINT}/stats` : ''

export interface TrackingGateInput {
  hostname: string
  endpoint?: string
  hosts?: readonly string[]
}

/** Pure, so the gate is unit-testable without a build-time env var. */
export function trackingEnabled({
  hostname,
  endpoint = ANALYTICS_ENDPOINT,
  hosts = TRACKED_HOSTS,
}: TrackingGateInput): boolean {
  if (!endpoint) return false
  return hosts.includes(hostname)
}
