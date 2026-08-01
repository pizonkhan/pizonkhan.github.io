import type { ProjectRecord } from './types'
import { nycHousingPrices } from './nyc-housing-prices'
import { birdSpeciesCnn } from './bird-species-cnn'

/**
 * The closed registry of personal projects. This is the only place a project record is
 * assembled from; nothing outside content/projects/ constructs a ProjectRecord.
 */
export const projects: readonly ProjectRecord[] = [nycHousingPrices, birdSpeciesCnn]

export function getProject(slug: string): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug)
}
