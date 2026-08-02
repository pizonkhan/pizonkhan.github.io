#!/usr/bin/env python3
"""
Trains the real model ladder the NYC 2025 sales page shows: a citywide median baseline, a
regularised linear model, a nearest-neighbour model, a random forest and a boosted-tree
ensemble (raw target and log target), scored on the same held-out split, plus permutation
importance for whichever rung wins. Writes content/data/nyc-2025-models.ts.

Source, same file scripts/build-nyc-sales-2025.mjs reads: NYC Open Data, "NYC Citywide
Annualized Calendar Sales Update", dataset id w2pb-icbu, New York City Department of Finance.
https://data.cityofnewyork.us/City-Government/NYC-Citywide-Annualized-Calendar-Sales-Update/w2pb-icbu

Download (about 16 MB, calendar 2025 only), identical to the Node generator's command:
    curl -sSG "https://data.cityofnewyork.us/resource/w2pb-icbu.csv" \\
      --data-urlencode '$select=sale_date,sale_price,borough,neighborhood,building_class_category,building_class_at_time_of,address,apartment_number,zip_code,residential_units,total_units,land_square_feet,gross_square_feet,year_built,latitude,longitude,bbl,nta' \\
      --data-urlencode "\\$where=sale_date>='2025-01-01'" \\
      --data-urlencode '$limit=100000' \\
      -o .data/nyc-sales-2025.csv

Usage:
    python3 scripts/train-nyc-sales-2025.py [path-to-csv]
With no argument, reads .data/nyc-sales-2025.csv, the same file
scripts/build-nyc-sales-2025.mjs downloads. This script never downloads anything itself: run
the Node generator first, or pass a path.

The filter chain below must match scripts/build-nyc-sales-2025.mjs exactly, threshold for
threshold, or this script would train on a different set of sales than the map draws:
    1. sale_date within calendar 2025
    2. latitude and longitude present and non-zero
    3. 100000 <= sale_price <= 10000000
    4. building_class_category in 01 02 03 04 09 10 12 13 15 17
The surviving count is printed after every step, same as the Node generator, so the two can
be compared by eye.

Run manually, once, by Pizon. Never wired into `npm run build` or any CI workflow, exactly
like scripts/build-nyc-sales-2025.mjs and scripts/build-bird-assets.py. Requires Python with
numpy, pandas and scikit-learn; XGBoost is optional (needs libomp on macOS, `brew install
libomp`) and the script adds a seventh rung only if `import xgboost` succeeds. This machine's
system Python is not touched: build an isolated environment instead, for example:

    uv venv --python 3.12 .venv-nyc-models
    source .venv-nyc-models/bin/activate
    uv pip install numpy pandas scikit-learn
    python3 scripts/train-nyc-sales-2025.py
    deactivate && rm -rf .venv-nyc-models

Every metric below is computed in dollars on the held-out test set, including for the
log-target rung, whose predictions are exponentiated back to dollars before scoring: an MAE
computed on log-dollars is not comparable to the other rungs' MAE and would make the ladder
lie about which model actually predicts price best.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.experimental import enable_iterative_imputer  # noqa: F401  (must precede the import below)
from sklearn.impute import IterativeImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, median_absolute_error, r2_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV_PATH = REPO_ROOT / ".data" / "nyc-sales-2025.csv"
MODULE_PATH = REPO_ROOT / "content" / "data" / "nyc-2025-models.ts"

YEAR = 2025
PRICE_FILTER = {"min": 100_000, "max": 10_000_000}

# Index 0..4, the same order content/data/nyc-2025-sales.ts uses: DOF borough code minus one.
BOROUGH_NAMES = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"]

CLASS_CODES = ["01", "02", "03", "04", "09", "10", "12", "13", "15", "17"]
# Identical strings to content/data/nyc-2025-sales.ts's CLASS_LABELS, restated here so the
# permutation importance bars can print a human label without importing a TypeScript module
# from Python.
CLASS_LABELS = {
    "01": "One family dwelling",
    "02": "Two family dwelling",
    "03": "Three family dwelling",
    "04": "Tax class 1 condo",
    "09": "Co-op, walkup apartment",
    "10": "Co-op, elevator apartment",
    "12": "Condo, walkup apartment",
    "13": "Condo, elevator apartment",
    "15": "Condo, 2 to 10 unit residential",
    "17": "Condo co-op",
}

SEED = 42
TEST_SIZE = 0.2

BOROUGH_FEATURE_COLUMNS = [f"borough_{name.replace(' ', '_')}" for name in BOROUGH_NAMES]
CLASS_FEATURE_COLUMNS = [f"class_{code}" for code in CLASS_CODES]
NUMERIC_FEATURE_COLUMNS = [
    "latitude",
    "longitude",
    "month",
    "residential_units",
    "total_units",
    "land_square_feet",
    "gross_square_feet",
    "year_built",
]
FEATURE_COLUMNS = BOROUGH_FEATURE_COLUMNS + CLASS_FEATURE_COLUMNS + NUMERIC_FEATURE_COLUMNS

FEATURE_LABELS = {
    **{f"borough_{name.replace(' ', '_')}": f"Borough: {name}" for name in BOROUGH_NAMES},
    **{f"class_{code}": f"Building type: {CLASS_LABELS[code]}" for code in CLASS_CODES},
    "latitude": "Latitude",
    "longitude": "Longitude",
    "month": "Sale month",
    "residential_units": "Residential units",
    "total_units": "Total units",
    "land_square_feet": "Land square feet",
    "gross_square_feet": "Gross square feet",
    "year_built": "Year built",
}

# Zero in these three columns means "not recorded", not a real zero. Converted to NaN before
# IterativeImputer runs, the same MICE step the 2019 capstone used.
ZERO_MEANS_MISSING = ["land_square_feet", "gross_square_feet", "year_built"]


def load_filtered_dataframe(csv_path: Path) -> pd.DataFrame:
    """Reads the DOF CSV and runs the same four-step filter chain
    scripts/build-nyc-sales-2025.mjs runs, printing the surviving count at each step."""
    raw = pd.read_csv(csv_path, dtype=str, keep_default_na=False)
    print(f"Parsed {len(raw)} rows from {csv_path}")

    sale_date = pd.to_datetime(raw["sale_date"], errors="coerce")
    in_year = raw[sale_date.dt.year == YEAR].copy()
    in_year["sale_date_parsed"] = sale_date[sale_date.dt.year == YEAR]
    print(f"1. sale_date within calendar {YEAR}: {len(in_year)}")

    lat = pd.to_numeric(in_year["latitude"], errors="coerce")
    lon = pd.to_numeric(in_year["longitude"], errors="coerce")
    geocoded = in_year[lat.notna() & lon.notna() & (lat != 0) & (lon != 0)].copy()
    print(f"2. latitude and longitude present and non-zero: {len(geocoded)}")

    price = pd.to_numeric(geocoded["sale_price"], errors="coerce")
    priced = geocoded[(price >= PRICE_FILTER["min"]) & (price <= PRICE_FILTER["max"])].copy()
    print(f"3. {PRICE_FILTER['min']} <= sale_price <= {PRICE_FILTER['max']}: {len(priced)}")

    class_code = priced["building_class_category"].str.slice(0, 2)
    surviving = priced[class_code.isin(CLASS_CODES)].copy()
    print(f"4. building_class_category in {' '.join(CLASS_CODES)}: {len(surviving)}")

    return build_feature_frame(surviving)


def strip_thousands(series: pd.Series) -> pd.Series:
    """DOF ships land_square_feet and gross_square_feet with thousands separators, e.g.
    "2,021". Strips them before converting to numeric, matching the Node generator's
    parseThousands."""
    return pd.to_numeric(series.astype(str).str.replace(",", "", regex=False), errors="coerce")


def build_feature_frame(rows: pd.DataFrame) -> pd.DataFrame:
    """Builds the fixed-order design matrix plus the sale_price target and the borough index,
    from the rows that already cleared the filter chain."""
    borough_index = pd.to_numeric(rows["borough"], errors="coerce").astype("Int64") - 1
    class_code = rows["building_class_category"].str.slice(0, 2)
    month = rows["sale_date_parsed"].dt.month - 1  # 0..11, matching points.json's m column

    frame = pd.DataFrame(index=rows.index)
    for name, index in zip(BOROUGH_NAMES, range(len(BOROUGH_NAMES))):
        column = f"borough_{name.replace(' ', '_')}"
        frame[column] = (borough_index == index).astype(float)
    for code in CLASS_CODES:
        frame[f"class_{code}"] = (class_code == code).astype(float)

    frame["latitude"] = pd.to_numeric(rows["latitude"], errors="coerce")
    frame["longitude"] = pd.to_numeric(rows["longitude"], errors="coerce")
    frame["month"] = month.astype(float)
    frame["residential_units"] = pd.to_numeric(rows["residential_units"], errors="coerce")
    frame["total_units"] = pd.to_numeric(rows["total_units"], errors="coerce")
    frame["land_square_feet"] = strip_thousands(rows["land_square_feet"])
    frame["gross_square_feet"] = strip_thousands(rows["gross_square_feet"])
    frame["year_built"] = pd.to_numeric(rows["year_built"], errors="coerce")

    for column in ZERO_MEANS_MISSING:
        frame.loc[frame[column] == 0, column] = np.nan

    frame = frame[FEATURE_COLUMNS]
    frame["sale_price"] = pd.to_numeric(rows["sale_price"], errors="coerce")
    frame["borough_index"] = borough_index.astype(int)
    return frame.reset_index(drop=True)


def linear_quantile(values: np.ndarray, q: float) -> float:
    """numpy.percentile's own default (linear interpolation between the two nearest order
    statistics), spelled out because it is the convention Task 2's generator also implements
    by hand, and the two must agree."""
    return float(np.percentile(values, q * 100, method="linear"))


def dollar_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """Every rung's scoring, always in dollars on the original scale."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = r2_score(y_true, y_pred)
    mape = float(np.mean(np.abs((y_true - y_pred) / y_true)))
    median_ae = median_absolute_error(y_true, y_pred)
    return {"mae": mae, "rmse": rmse, "r2": r2, "mape": mape, "medianAe": median_ae}


class ConstantRegressor:
    """The citywide median baseline: predicts one fixed dollar value for every row. Not a
    scikit-learn BaseEstimator subclass; it only needs to satisfy the small interface this
    script calls (predict), and permutation_importance is never run against it, since
    shuffling a feature this rung ignores cannot change its prediction."""

    def __init__(self, value: float) -> None:
        self.value = value

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.full(shape=(len(X),), fill_value=self.value)


def main() -> None:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV_PATH
    if not csv_path.exists():
        print(f"No CSV at {csv_path}. Run scripts/build-nyc-sales-2025.mjs first, or pass a path.")
        sys.exit(1)

    frame = load_filtered_dataframe(csv_path)
    print(f"{len(frame)} rows enter training, {len(FEATURE_COLUMNS)} features")

    X = frame[FEATURE_COLUMNS].to_numpy(dtype=float)
    y = frame["sale_price"].to_numpy(dtype=float)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=SEED,
    )
    print(f"Split: {len(X_train)} train, {len(X_test)} test, seed {SEED}, test_size {TEST_SIZE}")

    # IterativeImputer (MICE) fit on the train split only and applied to both splits, so no
    # information about a test row's own missing value ever reaches its imputation.
    imputer = IterativeImputer(random_state=SEED)
    X_train = imputer.fit_transform(X_train)
    X_test = imputer.transform(X_test)
    print("Imputed missing land_square_feet / gross_square_feet / year_built with IterativeImputer (MICE)")

    results: list[dict] = []

    # --- Rung 1: citywide median baseline --------------------------------------------------
    median_train = linear_quantile(y_train, 0.5)
    baseline = ConstantRegressor(median_train)
    pred = baseline.predict(X_test)
    results.append({
        "name": "Citywide median",
        "family": "baseline",
        **dollar_metrics(y_test, pred),
        "params": f"predicts the training-set median (${median_train:,.0f}) for every sale",
        "note": "The floor every other rung is measured against.",
        "estimator": baseline,
    })

    # --- Rung 2: Ridge regression ------------------------------------------------------------
    ridge_grid = GridSearchCV(
        Pipeline([("scaler", StandardScaler()), ("ridge", Ridge(random_state=SEED))]),
        param_grid={"ridge__alpha": [0.1, 1, 10, 100, 1000]},
        cv=5,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    ridge_grid.fit(X_train, y_train)
    ridge_best = ridge_grid.best_estimator_
    pred = ridge_best.predict(X_test)
    results.append({
        "name": "Ridge regression",
        "family": "linear",
        **dollar_metrics(y_test, pred),
        "params": f"alpha={ridge_grid.best_params_['ridge__alpha']} (5-fold CV over 0.1, 1, 10, 100, 1000), scaled features",
        "estimator": ridge_best,
    })
    print(f"Ridge: alpha={ridge_grid.best_params_['ridge__alpha']}")

    # --- Rung 3: k-nearest neighbours ---------------------------------------------------------
    knn_grid = GridSearchCV(
        Pipeline([("scaler", StandardScaler()), ("knn", KNeighborsRegressor())]),
        param_grid={"knn__n_neighbors": [3, 5, 10, 20, 40]},
        cv=5,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    knn_grid.fit(X_train, y_train)
    knn_best = knn_grid.best_estimator_
    pred = knn_best.predict(X_test)
    results.append({
        "name": "k-nearest neighbours",
        "family": "neighbours",
        **dollar_metrics(y_test, pred),
        "params": f"k={knn_grid.best_params_['knn__n_neighbors']} (5-fold CV over 3, 5, 10, 20, 40), scaled features",
        "estimator": knn_best,
    })
    print(f"k-NN: k={knn_grid.best_params_['knn__n_neighbors']}")

    # --- Rung 4: random forest -----------------------------------------------------------------
    forest_grid = GridSearchCV(
        RandomForestRegressor(n_estimators=300, random_state=SEED, n_jobs=-1),
        param_grid={"max_depth": [8, 12, 16, 20, None]},
        cv=3,
        scoring="neg_mean_absolute_error",
    )
    forest_grid.fit(X_train, y_train)
    forest_best = forest_grid.best_estimator_
    pred = forest_best.predict(X_test)
    results.append({
        "name": "Random forest",
        "family": "forest",
        **dollar_metrics(y_test, pred),
        "params": f"n_estimators=300, max_depth={forest_grid.best_params_['max_depth']} (3-fold CV over 8, 12, 16, 20, None)",
        "estimator": forest_best,
    })
    print(f"Random forest: max_depth={forest_grid.best_params_['max_depth']}")

    # --- Rung 5: gradient boosting, raw target -------------------------------------------------
    hgb_param_grid = {"max_depth": [None, 6, 10], "learning_rate": [0.05, 0.1]}
    hgb_raw_grid = GridSearchCV(
        HistGradientBoostingRegressor(random_state=SEED),
        param_grid=hgb_param_grid,
        cv=3,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    hgb_raw_grid.fit(X_train, y_train)
    hgb_raw_best = hgb_raw_grid.best_estimator_
    pred = hgb_raw_best.predict(X_test)
    results.append({
        "name": "Gradient boosting",
        "family": "boosting",
        **dollar_metrics(y_test, pred),
        "params": (
            f"max_depth={hgb_raw_grid.best_params_['max_depth']}, "
            f"learning_rate={hgb_raw_grid.best_params_['learning_rate']} "
            "(3-fold CV over max_depth None/6/10, learning_rate 0.05/0.1)"
        ),
        "estimator": hgb_raw_best,
    })
    print(f"Gradient boosting, raw target: {hgb_raw_grid.best_params_}")

    # --- Rung 6: gradient boosting, log target -------------------------------------------------
    # TransformedTargetRegressor fits the inner estimator on log(sale_price) and exponentiates
    # every prediction back to dollars before it is ever compared to y_test, so its .predict
    # output and every metric below are on the same dollar scale as every other rung.
    hgb_log_grid = GridSearchCV(
        TransformedTargetRegressor(
            regressor=HistGradientBoostingRegressor(random_state=SEED),
            func=np.log,
            inverse_func=np.exp,
        ),
        param_grid={f"regressor__{key}": value for key, value in hgb_param_grid.items()},
        cv=3,
        scoring="neg_mean_absolute_error",
        n_jobs=-1,
    )
    hgb_log_grid.fit(X_train, y_train)
    hgb_log_best = hgb_log_grid.best_estimator_
    pred = hgb_log_best.predict(X_test)
    best_log_params = {
        key.replace("regressor__", ""): value for key, value in hgb_log_grid.best_params_.items()
    }
    results.append({
        "name": "Gradient boosting, log target",
        "family": "boosting",
        **dollar_metrics(y_test, pred),
        "params": (
            f"max_depth={best_log_params['max_depth']}, learning_rate={best_log_params['learning_rate']} "
            "(3-fold CV over max_depth None/6/10, learning_rate 0.05/0.1), trained on log(sale_price)"
        ),
        "note": "Fitted on log(sale_price); every prediction is exponentiated back to dollars before scoring.",
        "estimator": hgb_log_best,
    })
    print(f"Gradient boosting, log target: {best_log_params}")

    # --- Rung 7 (optional): XGBoost -------------------------------------------------------------
    try:
        import xgboost as xgb

        xgb_grid = GridSearchCV(
            xgb.XGBRegressor(n_estimators=300, random_state=SEED, n_jobs=-1),
            param_grid={"max_depth": [4, 6, 8], "learning_rate": [0.05, 0.1]},
            cv=3,
            scoring="neg_mean_absolute_error",
        )
        xgb_grid.fit(X_train, y_train)
        xgb_best = xgb_grid.best_estimator_
        pred = xgb_best.predict(X_test)
        results.append({
            "name": "XGBoost",
            "family": "boosting",
            **dollar_metrics(y_test, pred),
            "params": (
                f"n_estimators=300, max_depth={xgb_grid.best_params_['max_depth']}, "
                f"learning_rate={xgb_grid.best_params_['learning_rate']} "
                "(3-fold CV over max_depth 4/6/8, learning_rate 0.05/0.1)"
            ),
            "estimator": xgb_best,
        })
        print(f"XGBoost: {xgb_grid.best_params_}")
    except Exception as error:  # ImportError, or the libomp dlopen failure XGBoost raises on macOS
        print(f"XGBoost skipped: {error}")

    # --- Order worst to best by test MAE, baseline first, winner last --------------------------
    results.sort(key=lambda r: r["mae"], reverse=True)
    winner = results[-1]
    print("\nLadder, worst to best:")
    for r in results:
        marker = "  <- best" if r is winner else ""
        print(f"  {r['name']:<32} MAE ${r['mae']:>12,.2f}  R2 {r['r2']:.4f}  MAPE {r['mape']:.4f}{marker}")

    # --- Permutation importance, winning model only ---------------------------------------------
    print(f"\nPermutation importance for the winner ({winner['name']}), test set, 10 repeats:")
    perm = permutation_importance(
        winner["estimator"], X_test, y_test,
        n_repeats=10, random_state=SEED, scoring="neg_mean_absolute_error", n_jobs=-1,
    )
    importances = sorted(
        (
            {
                "feature": FEATURE_COLUMNS[i],
                "label": FEATURE_LABELS[FEATURE_COLUMNS[i]],
                "meanIncreaseMae": float(perm.importances_mean[i]),
                "std": float(perm.importances_std[i]),
            }
            for i in range(len(FEATURE_COLUMNS))
        ),
        key=lambda entry: entry["meanIncreaseMae"],
        reverse=True,
    )[:12]
    for entry in importances:
        print(f"  {entry['label']:<40} +${entry['meanIncreaseMae']:>10,.2f}  (+/- ${entry['std']:,.2f})")

    write_module(results, importances, rows=len(frame), train_rows=len(X_train), test_rows=len(X_test))
    print(f"\nWrote {MODULE_PATH.relative_to(REPO_ROOT)}")


def format_ts_number(value: float) -> str:
    """Round-trips a Python float into a TypeScript numeric literal, dropping the sign on
    negative zero and trailing garbage from binary floating point."""
    rounded = round(value, 6)
    if rounded == 0:
        rounded = 0.0
    text = f"{rounded:.6f}".rstrip("0").rstrip(".")
    return text if text else "0"


def write_module(results: list[dict], importances: list[dict], rows: int, train_rows: int, test_rows: int) -> None:
    def model_literal(r: dict) -> str:
        note_line = f"\n    note: {json.dumps(r['note'])}," if "note" in r else ""
        return f"""  {{
    name: {json.dumps(r['name'])},
    family: {json.dumps(r['family'])},
    mae: {format_ts_number(r['mae'])},
    rmse: {format_ts_number(r['rmse'])},
    r2: {format_ts_number(r['r2'])},
    mape: {format_ts_number(r['mape'])},
    medianAe: {format_ts_number(r['medianAe'])},
    params: {json.dumps(r['params'])},{note_line}
  }}"""

    def importance_literal(entry: dict) -> str:
        return f"""  {{
    feature: {json.dumps(entry['feature'])},
    label: {json.dumps(entry['label'])},
    meanIncreaseMae: {format_ts_number(entry['meanIncreaseMae'])},
    std: {format_ts_number(entry['std'])},
  }}"""

    models_literal = ",\n".join(model_literal(r) for r in results)
    importance_literal_block = ",\n".join(importance_literal(entry) for entry in importances)
    features_literal = ",\n".join(f"    {json.dumps(name)}" for name in FEATURE_COLUMNS)
    winner_name = results[-1]["name"]

    module = f"""/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/train-nyc-sales-2025.py against the same NYC Open Data w2pb-icbu
 * calendar-2025 slice scripts/build-nyc-sales-2025.mjs reads, filtered identically. Every
 * metric is computed on a held-out test set never seen during fitting or hyperparameter
 * search; the log-target rung's predictions are exponentiated back to dollars before scoring.
 */

export type ModelFamily = 'baseline' | 'linear' | 'neighbours' | 'forest' | 'boosting'

export interface Model2025Result {{
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
}}

export interface FeatureImportance {{
  /** Column name as the pipeline sees it. */
  feature: string
  /** Human label rendered on the bar. */
  label: string
  /** Mean increase in test MAE, in dollars, when this column is shuffled. */
  meanIncreaseMae: number
  std: number
}}

export const TRAINING = {{
  rows: {rows},
  trainRows: {train_rows},
  testRows: {test_rows},
  seed: {SEED},
  testSize: {TEST_SIZE},
  features: [
{features_literal}
  ] as readonly string[],
  target: 'sale_price',
}} as const

/** Worst to best by test MAE. Baseline first, the winner last. */
export const MODELS_2025: readonly Model2025Result[] = [
{models_literal}
]

export const WINNER: Model2025Result = MODELS_2025[MODELS_2025.length - 1]

/** Permutation importance for {json.dumps(winner_name)}, the winning rung. Top 12, descending. */
export const IMPORTANCE_2025: readonly FeatureImportance[] = [
{importance_literal_block}
]
"""
    MODULE_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODULE_PATH.write_text(module)


if __name__ == "__main__":
    main()
