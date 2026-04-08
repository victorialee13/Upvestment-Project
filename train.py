from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yfinance as yf
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
FEATURE_COLUMNS = (
    "sma_10_ratio", "sma_50_ratio", "daily_return", "rsi",
    "macd_pct", "macd_signal_pct", "bb_width", "volatility_20", "momentum_5",
)


def load_spy_prices(period: str = "10y") -> pd.DataFrame:
    """Download SPY historical prices from Yahoo Finance."""
    ticker = yf.Ticker("SPY")
    df = ticker.history(period=period)
    if df.empty:
        raise RuntimeError("No data returned from Yahoo Finance for SPY.")
    df = df.reset_index()[["Date", "Close"]].rename(columns={"Date": "date", "Close": "close"})
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
    return df


def main() -> None:
    np.random.seed(SEED)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Downloading SPY prices from Yahoo Finance...")
    raw_prices = load_spy_prices(period="10y")
    print(f"Loaded {len(raw_prices)} rows of SPY data")

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
        n_estimators=500,
        max_depth=8,
        min_samples_leaf=5,
        max_features="sqrt",
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


