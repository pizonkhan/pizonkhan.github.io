/// <reference types="@cloudflare/vitest-pool-workers/types" />

/** Vite's ?raw suffix, used to inline migration SQL at bundle time. See apply-migrations.ts. */
declare module '*.sql?raw' {
  const content: string
  export default content
}
