'use client'

import { useEffect, useRef, useState } from 'react'
import { DURATION, useInViewOnce, usePrefersReducedMotion } from '@/lib/motion'

export interface AnimatedNumberProps {
  value: number
  /** Called to render the current value. Must be pure. */
  format: (value: number) => string
  durationMs?: number
  className?: string
}

/** Cubic bezier approximation of --ease-out, close enough for a progress curve driven by RAF. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
 * Counts from 0 to value on first entry into view. Reduced motion renders the final value
 * immediately. The display state starts at the true value (not 0), so the server-rendered
 * markup and any pre-hydration paint always show the real figure; the count-up resets to 0
 * and plays only once the animation is actually about to run.
 */
export function AnimatedNumber({ value, format, durationMs, className }: AnimatedNumberProps) {
  const [ref, hasEntered] = useInViewOnce<HTMLSpanElement>()
  const reduced = usePrefersReducedMotion()
  const [display, setDisplay] = useState(value)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    if (!hasEntered) return

    const duration = durationMs ?? DURATION.draw * 1000
    const start = performance.now()
    setDisplay(0)

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(value * easeOut(progress))
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      }
    }

    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [hasEntered, reduced, value, durationMs])

  return (
    <span ref={ref} className={className} aria-live="off" aria-label={format(value)}>
      {format(display)}
    </span>
  )
}
