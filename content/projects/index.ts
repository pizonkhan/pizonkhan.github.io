import type { ProjectRecord } from './types'
import { nycHomeSales2025 } from './nyc-home-sales-2025'
import { nycHousingPrices } from './nyc-housing-prices'
import { birdSpeciesCnn } from './bird-species-cnn'

/**
 * The closed registry of personal projects. This is the only place a project record is
 * assembled from; nothing outside content/projects/ constructs a ProjectRecord. The 2025 sales
 * map leads: it is the newest demonstration and the 2019 page's related link points back at it.
 */
export const projects: readonly ProjectRecord[] = [nycHomeSales2025, nycHousingPrices, birdSpeciesCnn]

export function getProject(slug: string): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug)
}
