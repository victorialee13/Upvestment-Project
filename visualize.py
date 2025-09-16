from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports"


def plot_feature_importance():
    model = joblib.load(MODELS_DIR / "model.pkl")
    features = json.loads((MODELS_DIR / "features.json").read_text())["columns"]
    importances = getattr(model, "feature_importances_", None)
    if importances is None:
        raise RuntimeError("Model has no feature_importances_.")

    fi = (
        pd.DataFrame({"feature": features, "importance": importances})
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )
    plt.figure(figsize=(8, 5))
    sns.barplot(x="importance", y="feature", data=fi, palette="viridis")
    plt.title("RandomForest Feature Importance")
    plt.tight_layout()
    out = REPORTS_DIR / "figures" / "feature_importance.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=150)
    print(f"Saved feature importance plot -> {out}")


def plot_predictions_vs_actual():
    df = pd.read_parquet(DATA_DIR / "processed.parquet")
    # Simple backtest on the last 250 points
    subset = df.tail(250).copy().reset_index(drop=True)
    features = json.loads((MODELS_DIR / "features.json").read_text())["columns"]
    model = joblib.load(MODELS_DIR / "model.pkl")

    X = subset[features].astype(float)
    proba_up = model.predict_proba(X)[:, 1]
    pred = (proba_up >= 0.5).astype(int)

    plt.figure(figsize=(10, 5))
    plt.plot(subset.index, subset["trend"], label="Actual trend", alpha=0.7)
    plt.plot(subset.index, pred, label="Predicted trend", alpha=0.7)
    plt.ylim(-0.1, 1.1)
    plt.yticks([0, 1], ["Down", "Up"])
    plt.title("Predicted vs Actual Trend (last 250)")
    plt.legend()
    plt.tight_layout()
    out = REPORTS_DIR / "figures" / "pred_vs_actual.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=150)
    print(f"Saved predictions vs actual plot -> {out}")


def main():
    plot_feature_importance()
    plot_predictions_vs_actual()


if __name__ == "__main__":
    main()


