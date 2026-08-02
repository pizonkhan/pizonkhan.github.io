'use client'

import { useCallback, useEffect, useId, useRef, useState, type FocusEvent } from 'react'
import { techniques } from '@/content/techniques'
import { usePrefersReducedMotion } from '@/lib/motion'

export interface GlossaryTermProps {
  /** The exact résumé phrase. Rendered verbatim as the link's visible text. */
  children: string
  /** A TechniqueNote id. The link targets `#technique-${techniqueId}`. */
  techniqueId: string
}

/**
 * An inline link from a résumé phrase to its concept note further down the same route, with a
 * hover-or-focus preview that repeats the note's own title and summary. Never a `title`
 * attribute: those are unreachable by keyboard and clipped by the browser's own timing, not
 * this component's. See docs/plans/experience-page-v2.md for why this is a link and not a
 * button, and for the WCAG 1.4.13 hoverable/dismissible/persistent contract the preview holds.
 */
export function GlossaryTerm({ children, techniqueId }: GlossaryTermProps) {
  const note = techniques.find((candidate) => candidate.id === techniqueId)
  const tipId = useId()
  const tipRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [shift, setShift] = useState(0)
  const reduced = usePrefersReducedMotion()

  const close = useCallback(() => {
    setOpen(false)
    setPlaced(false)
    setShift(0)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const node = tipRef.current
    if (!node) return
    const overflow = node.getBoundingClientRect().right - (window.innerWidth - 8)
    setShift(overflow > 0 ? -overflow : 0)
    setPlaced(true)
  }, [open])

  if (!note) {
    // The declared techniqueId does not resolve. Degrade to plain text rather than a dead
    // link: content/experience/experience-content.test.ts asserts every declared id resolves,
    // so this path only ever guards against future drift.
    return <>{children}</>
  }

  const openIfFocusVisible = (event: FocusEvent<HTMLAnchorElement>) => {
    try {
      if (event.target.matches(':focus-visible')) {
        setOpen(true)
      }
    } catch {
      setOpen(true)
    }
  }

  return (
    <span className="relative inline" onPointerEnter={() => setOpen(true)} onPointerLeave={close}>
      <a
        href={`#technique-${techniqueId}`}
        aria-describedby={tipId}
        onFocus={openIfFocusVisible}
        onBlur={close}
        className="rounded-xs text-accent underline decoration-dotted decoration-from-font underline-offset-4"
      >
        {children}
        <span className="sr-only">, concept note</span>
      </a>
      {/*
        Closed state is `display: none`, not `visibility: hidden`. A hidden-but-laid-out
        preview is still 256 px wide at `left: 0` relative to its term, and a term near the
        right edge pushes its box past the viewport, which gave /experience/ 196 px of
        horizontal page scroll at 375 px on load (571 px scrollWidth against a 375 px
        clientWidth). The clamp effect below only runs while the preview is open, so a
        preview that has never been opened was never pulled back. The node stays in the DOM
        either way, and aria-describedby resolves against a display: none element, so the
        description is announced on focus without the preview ever opening. scrollWidth is
        exactly 375 after this fix.
      */}
      <span
        id={tipId}
        role="tooltip"
        ref={tipRef}
        style={{
          display: open ? undefined : 'none',
          opacity: placed ? 1 : 0,
          transform: shift === 0 ? undefined : `translateX(${shift}px)`,
          transition: reduced ? 'none' : 'opacity var(--dur-fast) var(--ease-out)',
        }}
        className="absolute left-0 top-full z-10 w-64 pt-2"
      >
        <span className="block rounded-md border border-border-subtle bg-surface-1 p-3 shadow-card">
          <span className="block text-label text-text-tertiary">{note.title}</span>
          <span className="mt-1 block text-small text-text-secondary">{note.summary}</span>
        </span>
      </span>
    </span>
  )
}
