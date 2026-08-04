import { classifyHref, clampDurationSeconds, isValidSection, normalizeLabel, normalizePath, referrerHost } from './normalize'
import { KNOWN_ROUTES } from './routes'
import type { TargetKind } from './types'

const ID_RE = /^[0-9a-f]{32}$/
const MAX_EVENTS = 20
const TARGET_KINDS: readonly TargetKind[] = ['internal', 'outbound', 'anchor', 'mailto', 'download']

export interface NormalizedPageview {
  kind: 'pageview'
  id: string
  visit: string
  path: string
  referrerHost: string | null
}

export interface NormalizedClick {
  kind: 'click'
  id: string
  visit: string
  path: string
  section: string
  targetKind: TargetKind
  href: string
  label: string
}

export interface NormalizedDuration {
  kind: 'duration'
  id: string
  visit: string
  path: string
  durationSeconds: number
}

export type NormalizedEvent = NormalizedPageview | NormalizedClick | NormalizedDuration

export interface ValidationOk {
  ok: true
  events: NormalizedEvent[]
}

export interface ValidationErr {
  ok: false
  error: 'invalid_body' | 'invalid_event'
  detail: string
}

export type ValidationResult = ValidationOk | ValidationErr

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function invalidEvent(detail: string): ValidationErr {
  return { ok: false, error: 'invalid_event', detail }
}

function resolvePath(rawPath: unknown): string {
  if (typeof rawPath !== 'string') return '/unknown'
  const path = normalizePath(rawPath)
  return KNOWN_ROUTES.has(path) ? path : '/unknown'
}

function validateEvent(
  raw: unknown,
  siteOrigin: string,
): { ok: true; event: NormalizedEvent } | ValidationErr {
  if (!isRecord(raw)) return invalidEvent('event is not an object')
  if (typeof raw.id !== 'string' || !ID_RE.test(raw.id)) return invalidEvent('bad id')
  if (typeof raw.visit !== 'string' || !ID_RE.test(raw.visit)) return invalidEvent('bad visit')

  const path = resolvePath(raw.path)

  if (raw.kind === 'pageview') {
    const ref = typeof raw.ref === 'string' ? raw.ref : ''
    return {
      ok: true,
      event: {
        kind: 'pageview',
        id: raw.id,
        visit: raw.visit,
        path,
        referrerHost: ref ? referrerHost(ref, siteOrigin) : null,
      },
    }
  }

  if (raw.kind === 'click') {
    if (typeof raw.href !== 'string') return invalidEvent('missing href')
    if (typeof raw.targetKind !== 'string' || !TARGET_KINDS.includes(raw.targetKind as TargetKind)) {
      return invalidEvent('bad targetKind')
    }
    const classified = classifyHref({
      href: raw.href,
      siteOrigin,
      hasDownloadAttribute: raw.targetKind === 'download',
    })
    if (!classified) return invalidEvent('unclassifiable href')

    const rawSection = typeof raw.section === 'string' ? raw.section : 'unknown'
    if (!isValidSection(rawSection)) return invalidEvent('bad section')

    return {
      ok: true,
      event: {
        kind: 'click',
        id: raw.id,
        visit: raw.visit,
        path,
        section: rawSection,
        targetKind: classified.targetKind,
        href: classified.href,
        label: normalizeLabel(typeof raw.label === 'string' ? raw.label : ''),
      },
    }
  }

  if (raw.kind === 'duration') {
    if (typeof raw.seconds !== 'number') return invalidEvent('bad seconds')
    const seconds = clampDurationSeconds(raw.seconds)
    if (seconds === null) return invalidEvent('seconds out of range')
    return {
      ok: true,
      event: { kind: 'duration', id: raw.id, visit: raw.visit, path, durationSeconds: seconds },
    }
  }

  return invalidEvent('unknown kind')
}

/** Parses and validates a /collect body. siteOrigin is the request's own allowed Origin. */
export function validateCollectBody(rawBody: string, siteOrigin: string): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return { ok: false, error: 'invalid_body', detail: 'not json' }
  }

  if (!isRecord(parsed) || parsed.v !== 1) {
    return { ok: false, error: 'invalid_body', detail: 'bad or missing v' }
  }

  const rawEvents = parsed.events
  if (!Array.isArray(rawEvents) || rawEvents.length < 1 || rawEvents.length > MAX_EVENTS) {
    return { ok: false, error: 'invalid_body', detail: 'events must be an array of 1 to 20' }
  }

  const events: NormalizedEvent[] = []
  for (const raw of rawEvents) {
    const result = validateEvent(raw, siteOrigin)
    if (!result.ok) return result
    events.push(result.event)
  }
  return { ok: true, events }
}
