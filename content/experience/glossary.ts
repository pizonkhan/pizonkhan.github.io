import type { HighlightAnnotation } from '@/lib/glossary'

/**
 * Which résumé bullets carry an inline concept link, keyed by `${company}|${title}` and then by
 * the bullet's index in that role's `highlights` array. Most bullets carry none on purpose: a
 * link is added only where the phrase names a general method that has a note in
 * content/techniques.ts. Product names, tool names, team sizes and outcomes get no link.
 */
export const highlightAnnotations: Record<string, Record<number, readonly HighlightAnnotation[]>> = {
  'Webster Bank|Director, Credit Analytics': {
    0: [{ match: 'point-in-time snapshots', techniqueId: 'point-in-time-snapshots' }],
    1: [
      {
        match: 'data-quality and anomaly-detection pipelines',
        techniqueId: 'data-quality-reconciliation',
      },
    ],
  },
  'Webster Bank|Manager, Data Science': {
    0: [
      { match: 'PD and LGD dual-risk-rating models', techniqueId: 'pd-lgd-dual-risk-rating' },
      { match: 'weights of evidence', techniqueId: 'weights-of-evidence-binning' },
    ],
  },
  'Webster Bank|Data Scientist': {
    0: [
      {
        match: 'k-nearest-neighbor clustering',
        techniqueId: 'k-nearest-neighbor-clustering',
      },
    ],
  },
}
