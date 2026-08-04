import { describe, expect, it } from 'vitest'
import { trackingEnabled } from './config'

describe('trackingEnabled', () => {
  it('is false with an empty endpoint, on any host', () => {
    expect(trackingEnabled({ hostname: 'pizonkhan.github.io', endpoint: '' })).toBe(false)
    expect(trackingEnabled({ hostname: 'localhost', endpoint: '' })).toBe(false)
  })

  it('is false on localhost even with an endpoint configured', () => {
    expect(
      trackingEnabled({ hostname: 'localhost', endpoint: 'https://pk-site-analytics.example.workers.dev' }),
    ).toBe(false)
  })

  it('is false on 127.0.0.1 even with an endpoint configured', () => {
    expect(
      trackingEnabled({ hostname: '127.0.0.1', endpoint: 'https://pk-site-analytics.example.workers.dev' }),
    ).toBe(false)
  })

  it('is true on pizonkhan.github.io with an endpoint configured', () => {
    expect(
      trackingEnabled({
        hostname: 'pizonkhan.github.io',
        endpoint: 'https://pk-site-analytics.example.workers.dev',
      }),
    ).toBe(true)
  })

  it('respects an explicit hosts list, not just the default', () => {
    expect(
      trackingEnabled({
        hostname: 'staging.example.com',
        endpoint: 'https://pk-site-analytics.example.workers.dev',
        hosts: ['staging.example.com'],
      }),
    ).toBe(true)
  })
})
