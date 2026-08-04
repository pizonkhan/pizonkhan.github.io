/**
 * Visit and event identifiers, held in module scope only, never written to any browser
 * storage mechanism. Writing the visit id to any such mechanism is still "storing
 * information in the terminal equipment of a subscriber" under ePrivacy Article 5(3). A
 * plain module-scope variable is not, and it dies with the document, which is the one
 * behavior difference this design accepts on purpose.
 */

let visit: string | null = null
let viewSeq = 0

function randomHex32(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** The visit id for this document. Random, 32 hex, module scope, never written to storage. */
export function visitId(): string {
  if (!visit) visit = randomHex32()
  return visit
}

/** Fresh random 32 hex, one per pageview or click event. */
export function randomEventId(): string {
  return randomHex32()
}

/**
 * Stable id for the duration event of page view number `seq` in this visit. 32 hex.
 * Stable so that repeated cumulative sends for the same page view upsert instead of
 * inserting a new row.
 */
export function durationEventId(seq: number): string {
  return visitId().slice(0, 24) + seq.toString(16).padStart(8, '0')
}

/** Increments and returns the view sequence number. Starts at 1. */
export function nextViewSeq(): number {
  viewSeq += 1
  return viewSeq
}

/** Test-only. Clears the module-scope state. */
export function resetVisitState(): void {
  visit = null
  viewSeq = 0
}
