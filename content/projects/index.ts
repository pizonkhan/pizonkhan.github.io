import type { ProjectRecord } from './types'
import { icebergLakehousePlatform } from './iceberg-lakehouse-platform'
import { nycHomeSales2025 } from './nyc-home-sales-2025'
import { siteAnalytics } from './site-analytics'
import { nycHousingPrices } from './nyc-housing-prices'
import { birdSpeciesCnn } from './bird-species-cnn'

/**
 * The closed registry of personal projects. This is the only place a project record is
 * assembled from; nothing outside content/projects/ constructs a ProjectRecord. The lakehouse
 * leads: it is the newest demonstration and the one that shows the most engineering. The 2025
 * sales map follows, and the analytics pipeline goes after it rather than higher because it
 * honestly shows small numbers.
 */
export const projects: readonly ProjectRecord[] = [
  icebergLakehousePlatform,
  nycHomeSales2025,
  siteAnalytics,
  nycHousingPrices,
  birdSpeciesCnn,
]

export function getProject(slug: string): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug)
}
