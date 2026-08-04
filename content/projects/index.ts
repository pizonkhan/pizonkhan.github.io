import type { ProjectRecord } from './types'
import { nycHomeSales2025 } from './nyc-home-sales-2025'
import { siteAnalytics } from './site-analytics'
import { nycHousingPrices } from './nyc-housing-prices'
import { birdSpeciesCnn } from './bird-species-cnn'

/**
 * The closed registry of personal projects. This is the only place a project record is
 * assembled from; nothing outside content/projects/ constructs a ProjectRecord. The 2025 sales
 * map leads, since it is the newest demonstration, and the analytics pipeline goes second
 * rather than first because at launch it honestly shows very small numbers.
 */
export const projects: readonly ProjectRecord[] = [
  nycHomeSales2025,
  siteAnalytics,
  nycHousingPrices,
  birdSpeciesCnn,
]

export function getProject(slug: string): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug)
}
