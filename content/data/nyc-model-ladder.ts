/**
 * Hand-transcribed from the capstone notebook's printed cell outputs, not generated:
 * "Capstone 2 - NYC Housing Prediction/Notebooks/04_Modeling.ipynb"
 * (https://github.com/pizonkhan/Springboard-Data-Science). Every MAE, R-squared and MAPE
 * below matches that notebook's own evaluation cells, transcribed to the printed digit.
 *
 * Provenance note the numbers must not be "fixed" to agree with: a second notebook,
 * "Redo/Preprocessing and Modeling.ipynb", contains a different tuning run for the same final
 * model that lands on max_depth 6, colsample_bytree 0.9 and test MAE 198,190.93. The published
 * written report and Data/gbtuned.PNG both use the Notebooks/04 run below, so that is the run
 * this site shows.
 */

export interface ModelResult {
  name: string
  /** Test-set mean absolute error, USD. */
  mae: number
  /** Test-set R-squared. null for the mean baseline. */
  r2: number | null
  /** Test-set MAPE as a fraction. null where not recorded. */
  mape: number | null
  note?: string
}

export const MODEL_LADDER: readonly ModelResult[] = [
  { name: 'Predict the mean', mae: 495_842.77, r2: null, mape: null },
  { name: 'Linear regression', mae: 379_598.39, r2: 0.348, mape: 0.535 },
  { name: 'k-NN, k = 2', mae: 261_900.76, r2: 0.578, mape: 0.315 },
  { name: 'k-NN tuned, k = 18', mae: 249_954.91, r2: 0.624, mape: 0.322 },
  { name: 'Random forest, defaults', mae: 236_077.92, r2: 0.675, mape: 0.326 },
  {
    name: 'Random forest tuned (80 trees, depth 14)',
    mae: 222_413.37,
    r2: 0.698,
    mape: 0.301,
  },
  { name: 'XGBoost, defaults', mae: 220_371.98, r2: 0.697, mape: 0.290 },
  {
    name: 'XGBoost tuned, log target',
    mae: 191_770.86,
    r2: 0.723,
    mape: 0.216,
    note: 'Tuned parameters: max_depth 9, min_child_weight 3, eta 0.05, subsample 1.0, '
      + 'colsample_bytree 0.8, objective reg:squarederror, eval_metric mae.',
  },
]
