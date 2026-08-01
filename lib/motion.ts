'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * The motion vocabulary used everywhere on the site. Every JS-driven animation reads
 * DURATION / EASE / STAGGER from here rather than hardcoding a number, so the whole site
 * moves at one of a handful of speeds.
 */
export const DURATION = {
  fast: 0.12,
  base: 0.24,
  slow: 0.48,
  draw: 0.9,
  sequence: 1.8,
} as const

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const

export const STAGGER = 0.04

/**
 * Live-updating; listens to the media query rather than reading it once. Returns `false` on
 * the server and during the first client render, then updates in an effect. Reading
 * `matchMedia` during render would produce a hydration mismatch on a static export.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Fires once, the first time the element enters the viewport, and never resets. Used for
 * section reveals and one-shot data draws. Returns a callback ref to attach and whether it
 * has entered.
 *
 * A callback ref rather than a `useRef` object on purpose: several consumers render a
 * placeholder first (a loading paragraph, an error state) and only mount the ref'd node once
 * an async load resolves. A `useRef` object never re-runs the attach effect once the node
 * shows up late, so the observer would never be attached. A callback ref re-fires whenever
 * the node it's attached to changes, including from `null` to a real element.
 */
export function useInViewOnce<T extends Element>(
  options?: { threshold?: number; rootMargin?: string },
): [React.RefCallback<T>, boolean] {
  const [node, setNode] = useState<T | null>(null)
  const [hasEntered, setHasEntered] = useState(false)
  const threshold = options?.threshold ?? 0.25
  const rootMargin = options?.rootMargin ?? '0px 0px -15% 0px'
  const ref = useCallback((next: T | null) => setNode(next), [])

  useEffect(() => {
    if (hasEntered || !node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEntered(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, hasEntered, threshold, rootMargin])

  return [ref, hasEntered]
}
