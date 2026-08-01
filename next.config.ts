import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Served from a GitHub Pages *user* site (pizonkhan.github.io), so the base path is
 * empty in production. It stays configurable so the same build works when served
 * from a subpath, e.g. a preview deploy under /personal-website.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  // Static HTML export: GitHub Pages has no Node runtime. This is what makes
  // route handlers, middleware and request-time data fetching unavailable.
  output: 'export',
  basePath: basePath || undefined,
  // Emits about/index.html rather than about.html, which is what Pages expects.
  trailingSlash: true,
  // No image optimization server exists in an export.
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Pins the workspace root to this repo. Without it, a stray lockfile elsewhere on the
  // machine (outside this repo) can make Next infer the wrong root directory and fail
  // "Collecting build traces" with an ENOENT on the trace file.
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
