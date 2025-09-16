from __future__ import annotations

import json
from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
import pandas as pd
from kagglehub import dataset_download
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from features import (
    IndicatorConfig,
    add_indicators,
    add_trend_label,
    chronological_train_test_split,
    prepare_features,
)


PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports"

SEED = 42
FEATURE_COLUMNS = ("sma_10", "sma_50", "daily_return", "rsi")


def download_sp500_dataset() -> Path:
    """Download the Kaggle dataset and return the local path.

    Dataset: andrewmvd/sp-500-stocks
    """
    local_dir = dataset_download("andrewmvd/sp-500-stocks")
    return Path(local_dir)


def load_prices_from_dataset(dataset_path: Path) -> pd.DataFrame:
    """Load constituent prices. Fallback to SPY if present else equal-weighted index.

    The dataset contains per-ticker CSVs under a directory. We will try to find
    SPY.csv; if not found, we will aggregate closing prices from all tickers to
    form an equal-weighted series to use as the training target.
    """
    # Try to locate a CSV named 'SPY.csv'
    spy_csv = None
    for p in dataset_path.rglob("*.csv"):
        if p.name.lower() == "spy.csv":
            spy_csv = p
            break

    if spy_csv is not None:
        df = pd.read_csv(spy_csv)
        return df.rename(columns={"Date": "date", "Close": "close"})

    # Aggregate equal-weighted index from all CSVs
    frames = []
    for p in dataset_path.rglob("*.csv"):
        try:
            f = pd.read_csv(p, usecols=["Date", "Close"]).rename(
                columns={"Date": "date", "Close": "close"}
            )
            frames.append(f)
        except Exception:
            continue

    if not frames:
        raise RuntimeError("No price CSVs found in dataset to build index")

    all_df = pd.concat(frames, axis=0, ignore_index=True)
    all_df["date"] = pd.to_datetime(all_df["date"], errors="coerce")
    all_df = all_df.dropna(subset=["date", "close"]).sort_values("date")
    # Compute equal-weighted average close per date
    eq = all_df.groupby("date")["close"].mean().reset_index()
    return eq


def main() -> None:
    np.random.seed(SEED)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Downloading dataset from Kaggle...")
    dataset_path = download_sp500_dataset()
    print(f"Dataset at: {dataset_path}")

    print("Loading prices...")
    raw_prices = load_prices_from_dataset(dataset_path)

    print("Engineering indicators...")
    cfg = IndicatorConfig()
    df = add_indicators(raw_prices, cfg=cfg)
    df = add_trend_label(df)

    # Persist processed data
    processed_path = DATA_DIR / "processed.parquet"
    df.to_parquet(processed_path, index=False)
    print(f"Saved processed data -> {processed_path}")

    print("Chronological split...")
    train_df, test_df = chronological_train_test_split(df, test_size=0.2)

    X_train, y_train = prepare_features(train_df, FEATURE_COLUMNS)
    X_test, y_test = prepare_features(test_df, FEATURE_COLUMNS)

    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=SEED,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    print("Evaluating...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    print(f"Accuracy: {acc:.4f}")

    # Save artifacts
    model_path = MODELS_DIR / "model.pkl"
    joblib.dump(model, model_path)
    print(f"Saved model -> {model_path}")

    features_path = MODELS_DIR / "features.json"
    features_obj = {"columns": list(FEATURE_COLUMNS)}
    features_path.write_text(json.dumps(features_obj, indent=2))
    print(f"Saved feature schema -> {features_path}")

    metrics_path = REPORTS_DIR / "metrics.json"
    metrics = {"accuracy": float(acc), "classification_report": report}
    metrics_path.write_text(json.dumps(metrics, indent=2))
    print(f"Saved metrics -> {metrics_path}")


if __name__ == "__main__":
    main()


