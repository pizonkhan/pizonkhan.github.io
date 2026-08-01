'use client'

import { useEffect, useState } from 'react'
import { withBasePath } from '@/lib/base-path'

export type BirdAssetState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error' }

/**
 * Fetches one of the pre-generated bird assets from public/projects/bird-species-cnn/. These
 * assets are lazily loaded alongside their owning chunk (see BirdVisuals.tsx's viewport gate)
 * rather than bundled into the route's first-load JS, so a runtime fetch is the right shape
 * here, not a content/data/ module.
 */
export function useBirdAsset<T>(path: string): BirdAssetState<T> {
  const [state, setState] = useState<BirdAssetState<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    fetch(withBasePath(`/projects/bird-species-cnn/${path}`))
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} fetching ${path}`)
        return response.json() as Promise<T>
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [path])

  return state
}
