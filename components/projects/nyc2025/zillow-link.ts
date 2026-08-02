/**
 * Builds an outbound link to a Zillow *search* for a street address. This is the only place a
 * zillow.com URL is constructed on this site.
 *
 * What this is: a hyperlink to a public search page, built from the address and ZIP the New
 * York City Department of Finance publishes on its own open-data portal.
 *
 * What this is not, and must never become: an embed, an iframe, a fetch, a cached response, a
 * screenshot, or any storage of Zillow content. Zillow's terms forbid all of those. If a future
 * feature wants listing detail on the page, the answer is no.
 */
export function zillowSearchUrl(address: string, zip: string): string | null {
  const trimmedAddress = address.trim()
  if (trimmedAddress.length === 0) return null
  return `https://www.zillow.com/homes/${encodeURIComponent(`${trimmedAddress}, NY ${zip.trim()}`)}_rb/`
}
