import type { Env as WorkerEnv } from '../src/types'

// Merges our own Env into Cloudflare.Env, the type of `env` from 'cloudflare:test'.
declare global {
  namespace Cloudflare {
    interface Env extends WorkerEnv {}
  }
}

export {}
