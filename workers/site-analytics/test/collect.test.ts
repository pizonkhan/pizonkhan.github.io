import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import worker from '../src/index'

const ORIGIN = 'https://pizonkhan.github.io'
const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

function collectRequest(payload: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://worker.example/collect', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { origin: ORIGIN, 'user-agent': CHROME_UA, ...headers },
  })
}

async function send(request: Request): Promise<Response> {
  const ctx = createExecutionContext()
  const response = await worker.fetch(request, env, ctx)
  await waitOnExecutionContext(ctx)
  return response
}

function eventPayload(overrides: Partial<{ id: string; visit: string; kind: string; path: string }> = {}) {
  return {
    v: 1,
    events: [
      {
        id: 'a'.repeat(32),
        visit: 'b'.repeat(32),
        kind: 'pageview',
        path: '/projects/',
        ...overrides,
      },
    ],
  }
}

beforeEach(async () => {
  await env.DB.exec('DELETE FROM event')
})

describe('POST /collect', () => {
  it('stores one row with server-assigned ts, day, country, device and browser', async () => {
    const before = Date.now()
    const response = await send(collectRequest(eventPayload()))
    expect(response.status).toBe(204)

    const row = await env.DB.prepare('SELECT * FROM event').first<Record<string, unknown>>()
    expect(row).toBeTruthy()
    expect(row?.env).toBe('prod')
    expect(row?.day).toBe(new Date(before).toISOString().slice(0, 10))
    expect(typeof row?.ts).toBe('number')
    expect((row?.ts as number) - before).toBeLessThan(5000)
    expect(row?.country).toBeTruthy()
    expect(row?.device).toBeTruthy()
    expect(row?.browser).toBe('chrome')
  })

  it('is idempotent on a repeated pageview event_id', async () => {
    const payload = eventPayload()
    await send(collectRequest(payload))
    await send(collectRequest(payload))

    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM event').first<{ n: number }>()
    expect(count?.n).toBe(1)
  })

  it('upserts a duration event, keeping the maximum reported value', async () => {
    const id = 'c'.repeat(32)
    const visit = 'd'.repeat(32)
    await send(
      collectRequest({
        v: 1,
        events: [{ id, visit, kind: 'duration', path: '/', seconds: 40 }],
      }),
    )
    await send(
      collectRequest({
        v: 1,
        events: [{ id, visit, kind: 'duration', path: '/', seconds: 95 }],
      }),
    )
    let row = await env.DB.prepare('SELECT duration_s FROM event WHERE event_id = ?1')
      .bind(id)
      .first<{ duration_s: number }>()
    expect(row?.duration_s).toBe(95)

    await send(
      collectRequest({
        v: 1,
        events: [{ id, visit, kind: 'duration', path: '/', seconds: 30 }],
      }),
    )
    row = await env.DB.prepare('SELECT duration_s FROM event WHERE event_id = ?1')
      .bind(id)
      .first<{ duration_s: number }>()
    expect(row?.duration_s).toBe(95)
  })

  it('drops a Googlebot request with 204 and writes no rows', async () => {
    const response = await send(collectRequest(eventPayload(), { 'user-agent': 'Googlebot/2.1' }))
    expect(response.status).toBe(204)
    expect(response.headers.get('x-pk-ingest')).toBe('dropped-bot')

    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM event').first<{ n: number }>()
    expect(count?.n).toBe(0)
  })

  it('rejects a 9000-byte body with 413 and writes no rows', async () => {
    const padding = 'x'.repeat(9000)
    const request = new Request('https://worker.example/collect', {
      method: 'POST',
      body: padding,
      headers: { origin: ORIGIN, 'user-agent': CHROME_UA },
    })
    const response = await send(request)
    expect(response.status).toBe(413)

    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM event').first<{ n: number }>()
    expect(count?.n).toBe(0)
  })

  it('carries the expected headers and an empty body on success', async () => {
    const response = await send(collectRequest(eventPayload()))
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(response.headers.get('vary')).toBe('origin')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toBe('')
  })

  it('never stores the request IP or raw user agent', async () => {
    const distinctiveUa = 'DistinctiveUATestString/9.9.9'
    const response = await send(
      collectRequest(eventPayload(), {
        'user-agent': distinctiveUa,
        'cf-connecting-ip': '203.0.113.77',
      }),
    )
    expect(response.status).toBe(204)

    const rows = await env.DB.prepare('SELECT * FROM event').all()
    const serialized = JSON.stringify(rows.results)
    expect(serialized).not.toContain('203.0.113.77')
    expect(serialized).not.toContain(distinctiveUa)
  })

  it('rejects an origin outside the allowlist with 403', async () => {
    const request = new Request('https://worker.example/collect', {
      method: 'POST',
      body: JSON.stringify(eventPayload()),
      headers: { origin: 'https://example.com', 'user-agent': CHROME_UA },
    })
    const response = await send(request)
    expect(response.status).toBe(403)
  })

  it('rejects a missing origin with 403', async () => {
    const request = new Request('https://worker.example/collect', {
      method: 'POST',
      body: JSON.stringify(eventPayload()),
      headers: { 'user-agent': CHROME_UA },
    })
    const response = await send(request)
    expect(response.status).toBe(403)
  })
})

describe('OPTIONS', () => {
  it('carries the origin headers on a preflight from an allowed origin', async () => {
    const request = new Request('https://worker.example/collect', {
      method: 'OPTIONS',
      headers: { origin: ORIGIN },
    })
    const response = await send(request)
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(response.headers.get('vary')).toBe('origin')
    expect(response.headers.get('access-control-allow-methods')).toBe('GET, POST, OPTIONS')
    expect(response.headers.get('access-control-allow-headers')).toBe('content-type')
    expect(response.headers.get('access-control-max-age')).toBe('86400')
  })

  it('returns 404 for a preflight from a disallowed origin', async () => {
    const request = new Request('https://worker.example/collect', {
      method: 'OPTIONS',
      headers: { origin: 'https://example.com' },
    })
    const response = await send(request)
    expect(response.status).toBe(404)
  })
})

describe('GET /health', () => {
  it('reports ok with no origin restriction', async () => {
    const response = await send(new Request('https://worker.example/health'))
    expect(response.status).toBe(200)
    const body = (await response.json()) as { ok: boolean; db: string }
    expect(body.ok).toBe(true)
    expect(body.db).toBe('up')
  })
})
