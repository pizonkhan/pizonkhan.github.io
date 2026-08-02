'use client'

import { useEffect, useState } from 'react'
import { withBasePath } from '@/lib/base-path'

export interface SalesPoints {
  /** Snapshot metadata, printed by the figure so the page dates its own data. */
  meta: {
    generatedAt: string // 'YYYY-MM-DD'
    first: string // earliest sale_date in the snapshot, 'YYYY-MM-DD'
    last: string // latest sale_date, 'YYYY-MM-DD'
    n: number
  }
  /** Decoded WGS84 coordinates, length n. */
  lon: Float64Array
  lat: Float64Array
  /** Exact recorded sale price in whole dollars, length n. Never rounded: see assumption 16. */
  price: Uint32Array
  /** Index into CLASS_CODES, length n. */
  cls: Uint8Array
  /** 0..4, index into BOROUGHS, length n. */
  borough: Uint8Array
  /** 0..11, calendar month of the sale, length n. */
  month: Uint8Array
}

export interface SaleDetail {
  address: string
  apartment: string // '' when the sale is a whole building or lot
  /**
   * Neighbourhood as the Department of Finance spells it, e.g. 'SUNNYSIDE'. Decoded from the
   * shard's own name table, not from NEIGHBORHOODS_2025: the aggregate module drops rows below
   * the four-sale floor, and every individual sale still has a neighbourhood.
   */
  neighborhood: string
  zip: string
  /** Day offset from January 1 of the snapshot year. Rendered as a date by the panel. */
  day: number
  /** Gross square feet. 0 means the Department of Finance recorded none. */
  grossSqFt: number
  /** Year built. 0 means not recorded. */
  yearBuilt: number
}

export type PointsState =
  | { status: 'loading' }
  | { status: 'ready'; points: SalesPoints }
  | { status: 'error' }

/** Nothing selected, shard in flight, shard decoded, or shard request failed. */
export type DetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; detail: SaleDetail }
  | { status: 'error' }

/** Index into this array is the borough index every point and every shard uses. */
const BOROUGH_SLUGS = ['manhattan', 'bronx', 'brooklyn', 'queens', 'staten-island'] as const

interface RawPointsPayload {
  version: number
  generatedAt: string
  year: number
  first: string
  last: string
  n: number
  origin: { lon: number; lat: number }
  scale: number
  dy: number[]
  dx: number[]
  p: number[]
  c: number[]
  b: number[]
  m: number[]
}

interface RawShardPayload {
  borough: string
  boroughIndex: number
  index: number[]
  a: string[]
  u: string[]
  z: string[]
  d: number[]
  g: number[]
  y: number[]
  neighborhoods: string[]
  nb: number[]
}

/**
 * Turns the delta-encoded, sorted point payload into typed arrays. y and x are cumulative sums
 * of dy/dx, then converted back to WGS84 with the payload's own origin and scale. Exactly the
 * decode this module's contract documents: no arithmetic touches p, c, b or m beyond copying
 * them into a typed array of the right width.
 */
function decodePoints(raw: RawPointsPayload): SalesPoints {
  const n = raw.n
  const lat = new Float64Array(n)
  const lon = new Float64Array(n)
  const price = new Uint32Array(n)
  const cls = new Uint8Array(n)
  const borough = new Uint8Array(n)
  const month = new Uint8Array(n)

  let y = 0
  let x = 0
  for (let i = 0; i < n; i += 1) {
    y += raw.dy[i]
    x += raw.dx[i]
    lat[i] = raw.origin.lat + y / raw.scale
    lon[i] = raw.origin.lon + x / raw.scale
    price[i] = raw.p[i]
    cls[i] = raw.c[i]
    borough[i] = raw.b[i]
    month[i] = raw.m[i]
  }

  return {
    meta: { generatedAt: raw.generatedAt, first: raw.first, last: raw.last, n },
    lon,
    lat,
    price,
    cls,
    borough,
    month,
  }
}

/**
 * Fetches and decodes public/projects/nyc-home-sales-2025/points.json exactly once, through
 * withBasePath(), so a build under a subpath resolves it. `enabled` exists so the map's
 * fallback state, which covers both the WebGL-probe-false path and the rarer
 * Map-constructor-throw path, issues no request at all: the plan's fallback contract says that
 * state fetches neither points.json nor any shard. Stays 'loading' while disabled.
 */
export function useSalesPoints(enabled: boolean = true): PointsState {
  const [state, setState] = useState<PointsState>({ status: 'loading' })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    setState({ status: 'loading' })

    fetch(withBasePath('/projects/nyc-home-sales-2025/points.json'))
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} fetching points.json`)
        return response.json() as Promise<RawPointsPayload>
      })
      .then((raw) => {
        if (!cancelled) setState({ status: 'ready', points: decodePoints(raw) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return state
}

/**
 * One shard fetch, and one index -> position lookup, cached per borough for the life of the
 * page. Module scope on purpose: SalesMap mounts this hook once, but caching here rather than
 * in component state means a shard already in flight or already decoded is never re-requested,
 * even across a remount.
 */
const shardData = new Map<number, RawShardPayload>()
const shardRequests = new Map<number, Promise<RawShardPayload>>()
const shardLookups = new Map<number, Map<number, number>>()

function fetchShard(boroughIndex: number): Promise<RawShardPayload> {
  const cached = shardData.get(boroughIndex)
  if (cached) return Promise.resolve(cached)

  const inflight = shardRequests.get(boroughIndex)
  if (inflight) return inflight

  const slug = BOROUGH_SLUGS[boroughIndex]
  const request = fetch(withBasePath(`/projects/nyc-home-sales-2025/detail/${slug}.json`))
    .then((response) => {
      if (!response.ok) throw new Error(`${response.status} fetching ${slug}.json`)
      return response.json() as Promise<RawShardPayload>
    })
    .then((data) => {
      shardData.set(boroughIndex, data)
      shardRequests.delete(boroughIndex)
      return data
    })
    .catch((error) => {
      shardRequests.delete(boroughIndex)
      throw error
    })

  shardRequests.set(boroughIndex, request)
  return request
}

function lookupPosition(boroughIndex: number, shard: RawShardPayload, globalIndex: number): number {
  let lookup = shardLookups.get(boroughIndex)
  if (!lookup) {
    lookup = new Map()
    for (let position = 0; position < shard.index.length; position += 1) {
      lookup.set(shard.index[position], position)
    }
    shardLookups.set(boroughIndex, lookup)
  }
  return lookup.get(globalIndex) ?? -1
}

/**
 * Fetches the detail shard for one borough on demand, through withBasePath(), and caches it for
 * the session. Returns 'loading' while the shard is in flight, so the caller renders its
 * reserved line box rather than a spinner, and 'error' when the request fails, so the panel can
 * never sit on the loading sentence forever.
 */
export function useSaleDetail(boroughIndex: number | null, globalIndex: number | null): DetailState {
  const [state, setState] = useState<DetailState>({ status: 'idle' })

  useEffect(() => {
    if (boroughIndex === null || globalIndex === null) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    fetchShard(boroughIndex)
      .then((shard) => {
        if (cancelled) return
        const position = lookupPosition(boroughIndex, shard, globalIndex)
        if (position === -1) {
          setState({ status: 'error' })
          return
        }
        setState({
          status: 'ready',
          detail: {
            address: shard.a[position],
            apartment: shard.u[position],
            neighborhood: shard.neighborhoods[shard.nb[position]],
            zip: shard.z[position],
            day: shard.d[position],
            grossSqFt: shard.g[position],
            yearBuilt: shard.y[position],
          },
        })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [boroughIndex, globalIndex])

  return state
}
