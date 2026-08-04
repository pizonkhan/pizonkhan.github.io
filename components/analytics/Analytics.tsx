'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackingEnabled } from '@/lib/analytics/config'
import type { TrackerHandle } from '@/lib/analytics/tracker'

/**
 * Mounted once in the root layout. Renders nothing. Holds no state a visitor can see.
 *
 * The tracker itself is a separate module imported from an idle callback, so it lands in
 * its own chunk and never sits on the critical path. On any host other than the live site
 * the import never happens at all.
 */
export function Analytics(): null {
  const pathname = usePathname()
  const handleRef = useRef<TrackerHandle | null>(null)
  const pendingPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!trackingEnabled({ hostname: window.location.hostname })) return

    let cancelled = false
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    function load() {
      import('@/lib/analytics/tracker').then(({ start }) => {
        if (cancelled) return
        const handle = start()
        handleRef.current = handle
        if (pendingPathRef.current !== null) handle.pageview(pendingPathRef.current)
      })
    }

    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(load)
    } else {
      timeoutId = setTimeout(load, 300)
    }

    return () => {
      cancelled = true
      if (idleId !== undefined && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
      handleRef.current?.stop()
      handleRef.current = null
    }
  }, [])

  useEffect(() => {
    if (handleRef.current) {
      handleRef.current.pageview(pathname)
    } else {
      pendingPathRef.current = pathname
    }
  }, [pathname])

  return null
}
