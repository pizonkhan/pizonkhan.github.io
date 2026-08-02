/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/train-nyc-sales-2025.py against the same NYC Open Data w2pb-icbu
 * calendar-2025 slice scripts/build-nyc-sales-2025.mjs reads, filtered identically. Every
 * metric is computed on a held-out test set never seen during fitting or hyperparameter
 * search; the log-target rung's predictions are exponentiated back to dollars before scoring.
 */

export type ModelFamily = 'baseline' | 'linear' | 'neighbours' | 'forest' | 'boosting'

export interface Model2025Result {
  name: string
  family: ModelFamily
  /** Test-set mean absolute error in dollars. */
  mae: number
  rmse: number
  /** Test-set R-squared on dollars, not on the log target. */
  r2: number
  /** Test-set MAPE as a fraction. */
  mape: number
  medianAe: number
  /** The exact hyperparameters this rung was fitted with. */
  params: string
  note?: string
}

export interface FeatureImportance {
  /** Column name as the pipeline sees it. */
  feature: string
  /** Human label rendered on the bar. */
  label: string
  /** Mean increase in test MAE, in dollars, when this column is shuffled. */
  meanIncreaseMae: number
  std: number
}

export const TRAINING = {
  rows: 44784,
  trainRows: 35827,
  testRows: 8957,
  seed: 42,
  testSize: 0.2,
  features: [
    "borough_Manhattan",
    "borough_Bronx",
    "borough_Brooklyn",
    "borough_Queens",
    "borough_Staten_Island",
    "class_01",
    "class_02",
    "class_03",
    "class_04",
    "class_09",
    "class_10",
    "class_12",
    "class_13",
    "class_15",
    "class_17",
    "latitude",
    "longitude",
    "month",
    "residential_units",
    "total_units",
    "land_square_feet",
    "gross_square_feet",
    "year_built"
  ] as readonly string[],
  target: 'sale_price',
} as const

/** Worst to best by test MAE. Baseline first, the winner last. */
export const MODELS_2025: readonly Model2025Result[] = [
  {
    name: "Citywide median",
    family: "baseline",
    mae: 645311.012951,
    rmse: 1199730.80937,
    r2: -0.08318,
    mape: 0.655327,
    medianAe: 360000,
    params: "predicts the training-set median ($840,000) for every sale",
    note: "The floor every other rung is measured against.",
  },
  {
    name: "Ridge regression",
    family: "linear",
    mae: 586820.230348,
    rmse: 1002202.578611,
    r2: 0.244135,
    mape: 0.693424,
    medianAe: 339601.195277,
    params: "alpha=1000 (5-fold CV over 0.1, 1, 10, 100, 1000), scaled features",
  },
  {
    name: "k-nearest neighbours",
    family: "neighbours",
    mae: 459160.367065,
    rmse: 849519.439673,
    r2: 0.4569,
    mape: 0.486853,
    medianAe: 203118,
    params: "k=5 (5-fold CV over 3, 5, 10, 20, 40), scaled features",
  },
  {
    name: "Gradient boosting",
    family: "boosting",
    mae: 411730.85987,
    rmse: 739057.473085,
    r2: 0.588955,
    mape: 0.463959,
    medianAe: 206396.424642,
    params: "max_depth=None, learning_rate=0.1 (3-fold CV over max_depth None/6/10, learning_rate 0.05/0.1)",
  },
  {
    name: "Gradient boosting, log target",
    family: "boosting",
    mae: 399410.843859,
    rmse: 785392.18051,
    r2: 0.535799,
    mape: 0.370108,
    medianAe: 180389.747166,
    params: "max_depth=10, learning_rate=0.1 (3-fold CV over max_depth None/6/10, learning_rate 0.05/0.1), trained on log(sale_price)",
    note: "Fitted on log(sale_price); every prediction is exponentiated back to dollars before scoring.",
  },
  {
    name: "Random forest",
    family: "forest",
    mae: 377558.133883,
    rmse: 708446.507069,
    r2: 0.6223,
    mape: 0.402227,
    medianAe: 169399.876378,
    params: "n_estimators=300, max_depth=20 (3-fold CV over 8, 12, 16, 20, None)",
  }
]

export const WINNER: Model2025Result = MODELS_2025[MODELS_2025.length - 1]

/** Permutation importance for "Random forest", the winning rung. Top 12, descending. */
export const IMPORTANCE_2025: readonly FeatureImportance[] = [
  {
    feature: "gross_square_feet",
    label: "Gross square feet",
    meanIncreaseMae: 569622.649817,
    std: 7012.123702,
  },
  {
    feature: "residential_units",
    label: "Residential units",
    meanIncreaseMae: 305722.872196,
    std: 4783.693424,
  },
  {
    feature: "borough_Manhattan",
    label: "Borough: Manhattan",
    meanIncreaseMae: 269204.063342,
    std: 6225.75673,
  },
  {
    feature: "longitude",
    label: "Longitude",
    meanIncreaseMae: 267699.765528,
    std: 2949.476183,
  },
  {
    feature: "latitude",
    label: "Latitude",
    meanIncreaseMae: 244379.089428,
    std: 3813.621526,
  },
  {
    feature: "year_built",
    label: "Year built",
    meanIncreaseMae: 155138.435651,
    std: 4637.851302,
  },
  {
    feature: "total_units",
    label: "Total units",
    meanIncreaseMae: 135446.30749,
    std: 2728.410889,
  },
  {
    feature: "land_square_feet",
    label: "Land square feet",
    meanIncreaseMae: 79542.445722,
    std: 1302.038553,
  },
  {
    feature: "class_10",
    label: "Building type: Co-op, elevator apartment",
    meanIncreaseMae: 71186.104767,
    std: 1034.889636,
  },
  {
    feature: "borough_Brooklyn",
    label: "Borough: Brooklyn",
    meanIncreaseMae: 59456.192671,
    std: 1724.244987,
  },
  {
    feature: "borough_Queens",
    label: "Borough: Queens",
    meanIncreaseMae: 45849.004823,
    std: 1846.473998,
  },
  {
    feature: "class_09",
    label: "Building type: Co-op, walkup apartment",
    meanIncreaseMae: 12165.263765,
    std: 559.833096,
  }
]
