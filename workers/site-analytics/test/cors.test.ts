import { describe, expect, it } from 'vitest'
import { classifyOrigin, parseAllowedOrigins } from '../src/cors'

const ALLOWED = parseAllowedOrigins(
  'https://pizonkhan.github.io,http://localhost:3000,http://127.0.0.1:3000',
)

describe('classifyOrigin', () => {
  it('classifies the production origin as prod', () => {
    expect(classifyOrigin('https://pizonkhan.github.io', ALLOWED)).toEqual({
      allowed: true,
      env: 'prod',
    })
  })

  it('classifies localhost and 127.0.0.1 as dev', () => {
    expect(classifyOrigin('http://localhost:3000', ALLOWED)).toEqual({ allowed: true, env: 'dev' })
    expect(classifyOrigin('http://127.0.0.1:3000', ALLOWED)).toEqual({ allowed: true, env: 'dev' })
  })

  it('rejects an origin outside the allowlist', () => {
    expect(classifyOrigin('https://example.com', ALLOWED)).toEqual({ allowed: false, env: null })
  })

  it('rejects a missing origin', () => {
    expect(classifyOrigin(null, ALLOWED)).toEqual({ allowed: false, env: null })
  })
})
