import { COLLECT_URL } from './config'
import {
  classifyHref,
  normalizeDuration,
  normalizeLabel,
  normalizePath,
  pickSection,
  type AncestorNode,
} from './normalize'
import { durationEventId, nextViewSeq, randomEventId, visitId } from './visit'
import { send } from './transport'

export interface TrackerHandle {
  /** Records a page view for `path` and restarts the visible-time clock. */
  pageview(path: string): void
  /** Unbinds every listener. Flushes the pending duration first. */
  stop(): void
}

const MAX_ANCESTOR_DEPTH = 12

let seq = 0
let currentPath = ''
let accumulatedMs = 0
let visibleSince: number | null = null
let refSent = false

function flushDuration(): void {
  if (visibleSince !== null) {
    accumulatedMs += performance.now() - visibleSince
    visibleSince = null
  }
  if (seq < 1) return
  const seconds = normalizeDuration(accumulatedMs)
  if (seconds === null) return
  send(
    COLLECT_URL,
    {
      v: 1,
      events: [
        { id: durationEventId(seq), visit: visitId(), kind: 'duration', path: currentPath, seconds },
      ],
    },
    { beacon: true },
  )
}

function pageview(rawPath: string): void {
  try {
    // usePathname() returns whatever the router gives it; normalising here is what makes
    // trailingSlash and casing irrelevant to every downstream consumer of currentPath.
    const path = normalizePath(rawPath)
    flushDuration()
    seq = nextViewSeq()
    currentPath = path
    accumulatedMs = 0
    visibleSince = document.visibilityState === 'visible' ? performance.now() : null

    const event: Record<string, unknown> = {
      id: randomEventId(),
      visit: visitId(),
      kind: 'pageview',
      path,
    }
    if (!refSent) {
      event.ref = document.referrer
      refSent = true
    }
    send(COLLECT_URL, { v: 1, events: [event] })
  } catch {
    // A thrown error here must never surface as a page error.
  }
}

function buildAncestorChain(start: Element): AncestorNode[] {
  const chain: AncestorNode[] = []
  let node: Element | null = start
  let depth = 0
  while (node && depth < MAX_ANCESTOR_DEPTH) {
    chain.push({
      dataSection: node.getAttribute('data-section'),
      tag: node.tagName,
      id: node.id || null,
    })
    node = node.parentElement
    depth += 1
  }
  return chain
}

function pickLabel(el: Element): string {
  const fromText = normalizeLabel(el.textContent)
  if (fromText) return fromText
  const fromAria = normalizeLabel(el.getAttribute('aria-label'))
  if (fromAria) return fromAria
  const fromTitle = normalizeLabel(el.getAttribute('title'))
  if (fromTitle) return fromTitle
  const img = el.querySelector('img[alt]')
  return normalizeLabel(img?.getAttribute('alt'))
}

function onClick(event: MouseEvent): void {
  try {
    const target = event.target as Element | null
    const el = target?.closest?.('a[href], [data-track]')
    if (!el) return

    const classified = classifyHref({
      href: el.getAttribute('href') ?? '',
      siteOrigin: location.origin,
      hasDownloadAttribute: el.hasAttribute('download'),
    })
    if (!classified) return

    const section = pickSection(buildAncestorChain(el))
    const label = pickLabel(el)

    send(
      COLLECT_URL,
      {
        v: 1,
        events: [
          {
            id: randomEventId(),
            visit: visitId(),
            kind: 'click',
            path: currentPath,
            targetKind: classified.targetKind,
            href: classified.href,
            section,
            label,
          },
        ],
      },
      { beacon: true },
    )
  } catch {
    // A thrown error here must never surface as a page error.
  }
}

function onVisibilityChange(): void {
  try {
    flushDuration()
    if (document.visibilityState === 'visible') {
      visibleSince = performance.now()
    }
  } catch {
    // A thrown error here must never surface as a page error.
  }
}

function onPageHide(): void {
  try {
    flushDuration()
  } catch {
    // A thrown error here must never surface as a page error.
  }
}

/** Wires the document-level listeners. Does not send a page view on its own. */
export function start(): TrackerHandle {
  // 'freeze' (Page Lifecycle API) is not in TypeScript's DOM lib. Cast to EventTarget once
  // to use its untyped string overload rather than widening the whole listener to `any`.
  const untypedDocument = document as EventTarget

  // Capture phase, so a component that calls stopPropagation cannot hide the click. A click
  // event also fires on Enter for links and buttons, so keyboard activation needs no second
  // listener. auxclick is not listened for, so a middle-click open is not counted.
  document.addEventListener('click', onClick, true)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)
  untypedDocument.addEventListener('freeze', onPageHide)

  return {
    pageview,
    stop(): void {
      flushDuration()
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
      untypedDocument.removeEventListener('freeze', onPageHide)
    },
  }
}
