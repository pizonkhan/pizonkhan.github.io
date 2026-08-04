import { applyD1Migrations, env } from 'cloudflare:test'
import { beforeAll } from 'vitest'
import m0001 from '../migrations/0001_create_event.sql?raw'
import m0002 from '../migrations/0002_create_rollups.sql?raw'

/**
 * The migration files are inlined at bundle time with Vite's ?raw suffix rather than read
 * from disk at test time: this setup file runs inside the workerd runtime, which has no
 * filesystem, and readD1Migrations() (Node-only, despite living in this same package) cannot
 * be called from here.
 */
function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, [
    { name: '0001_create_event.sql', queries: splitStatements(m0001) },
    { name: '0002_create_rollups.sql', queries: splitStatements(m0002) },
  ])
})
