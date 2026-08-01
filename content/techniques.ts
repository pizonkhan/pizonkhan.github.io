/**
 * Generic method explainers for /experience/. General terms only: no coefficients, no bin
 * edges, no thresholds, no portfolio names, no system names, no accuracy figures. The ROC
 * figures on the résumé stay on the résumé timeline, not here, because a reader would read a
 * number in this file as model documentation rather than as a résumé bullet.
 */

export interface TechniqueNote {
  id: string
  title: string
  /** 2-4 sentences. General method only. */
  body: string[]
  /** Compile-time reminder of the boundary. Both fields are required. */
  scope: 'general-method'
  containsEmployerSpecifics: false
}

export const techniques: TechniqueNote[] = [
  {
    id: 'pd-lgd-dual-risk-rating',
    title: 'PD and LGD dual risk rating',
    body: [
      'A dual risk rating scores a loan on two separate questions: how likely is default, ' +
        'and how much is lost if it happens. Probability of default (PD) and loss given ' +
        'default (LGD) are estimated as two distinct models rather than blended into one ' +
        'score, because a low-PD, high-LGD loan and a high-PD, low-LGD loan carry very ' +
        'different risk even when a single combined number would make them look alike.',
      'Separating the two lets a lender price and reserve for each dimension on its own ' +
        'terms, and lets an underwriter see which lever is actually driving a deal’s risk.',
    ],
    scope: 'general-method',
    containsEmployerSpecifics: false,
  },
  {
    id: 'weights-of-evidence-binning',
    title: 'Weights of evidence binning',
    body: [
      'Weights of evidence recodes a continuous driver, a utilization ratio or a credit ' +
        'score for instance, into ordered bins, then replaces each bin with a single ' +
        'log-odds number describing how that group compares to the overall population.',
      'The transform keeps a logistic regression model interpretable: a coefficient on a ' +
        'weights-of-evidence variable reads directly as this group makes the outcome more ' +
        'or less likely, in a way a raw continuous coefficient does not. Binning also ' +
        'absorbs non-linear relationships and outliers that a linear model would otherwise ' +
        'fight.',
    ],
    scope: 'general-method',
    containsEmployerSpecifics: false,
  },
  {
    id: 'point-in-time-snapshots',
    title: 'Point-in-time snapshots',
    body: [
      'A point-in-time snapshot captures the full state of a table exactly as it stood on ' +
        'a given date, rather than overwriting old values as new ones arrive.',
      'That distinction matters wherever a number gets restated later: a snapshot ' +
        'reproduces exactly what a report showed on the day it published, even after the ' +
        'underlying data is later corrected or reclassified. It is the difference between ' +
        'a current-state table, which only ever answers what is true now, and a system ' +
        'that can answer what was believed true then.',
    ],
    scope: 'general-method',
    containsEmployerSpecifics: false,
  },
  {
    id: 'data-quality-reconciliation',
    title: 'Data quality and reconciliation',
    body: [
      'A reconciliation framework compares a downstream number against its source on a ' +
        'schedule and flags where the two disagree, rather than trusting a pipeline to ' +
        'fail loudly on its own.',
      'Most breaks are quiet: a join that silently drops rows, a source that changes a ' +
        'column’s meaning without changing its name, a load that runs twice. Catching ' +
        'these before a number is published, instead of after, is the entire point of the ' +
        'check.',
    ],
    scope: 'general-method',
    containsEmployerSpecifics: false,
  },
]
