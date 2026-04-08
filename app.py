from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from features import compute_rsi


PROJECT_ROOT = Path(__file__).resolve().parent
MODELS_DIR = PROJECT_ROOT / "models"


class PredictRequest(BaseModel):
    sma_10: float = Field(..., description="10-day simple moving average")
    sma_50: float = Field(..., description="50-day simple moving average")
    daily_return: float = Field(..., description="Daily return as decimal")
    rsi: float = Field(..., ge=0, le=100, description="Relative Strength Index (0–100)")


class PredictResponse(BaseModel):
    prediction: str
    prob_up: float


class LiveIndicatorsResponse(BaseModel):
    sma_10: float
    sma_50: float
    daily_return: float
    rsi: float
    price: float
    as_of: str


class FeatureImportanceResponse(BaseModel):
    features: List[str]
    importances: List[float]


def load_model_and_schema():
    model_path = MODELS_DIR / "model.pkl"
    features_path = MODELS_DIR / "features.json"

    if not model_path.exists() or not features_path.exists():
        raise FileNotFoundError(
            "Model artifacts not found. Please run training first (python train.py)."
        )

    model = joblib.load(model_path)
    features = json.loads(features_path.read_text())
    feature_cols = features.get("columns", [])
    if not feature_cols:
        raise RuntimeError("Feature schema is empty or invalid.")
    return model, feature_cols


app = FastAPI(title="UPvestment", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model, feature_cols = load_model_and_schema()


@app.get("/")
def root() -> Dict[str, str]:
    return {
        "message": "Welcome to UPvestment API",
        "model": "RandomForestClassifier",
        "features": ",".join(feature_cols),
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    try:
        feature_map = req.dict()
        x = np.array([[float(feature_map[col]) for col in feature_cols]], dtype=float)
        proba = getattr(model, "predict_proba", None)
        if proba is None:
            raise RuntimeError("Loaded model does not support predict_proba.")
        prob_up = float(model.predict_proba(x)[0][1])
        label = "Up" if prob_up >= 0.5 else "Down"
        return PredictResponse(prediction=label, prob_up=prob_up)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing feature: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/live-indicators", response_model=LiveIndicatorsResponse)
def live_indicators() -> LiveIndicatorsResponse:
    """Fetch latest SPY data from Yahoo Finance and compute technical indicators."""
    try:
        ticker = yf.Ticker("SPY")
        # Fetch 80 days to have enough history for SMA-50 + RSI-14 warmup
        df = ticker.history(period="80d")
        if df.empty:
            raise HTTPException(status_code=503, detail="No data returned from Yahoo Finance.")

        close = df["Close"]
        sma_10 = float(close.rolling(10, min_periods=10).mean().iloc[-1])
        sma_50 = float(close.rolling(50, min_periods=50).mean().iloc[-1])
        daily_return = float(close.pct_change().iloc[-1])
        rsi = float(compute_rsi(close, window=14).iloc[-1])
        price = float(close.iloc[-1])
        as_of = str(df.index[-1].date())

        return LiveIndicatorsResponse(
            sma_10=round(sma_10, 4),
            sma_50=round(sma_50, 4),
            daily_return=round(daily_return, 6),
            rsi=round(rsi, 2),
            price=round(price, 2),
            as_of=as_of,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live data: {e}")


@app.get("/feature-importance", response_model=FeatureImportanceResponse)
def feature_importance() -> FeatureImportanceResponse:
    """Return feature importances from the trained RandomForest model."""
    importances = model.feature_importances_.tolist()
    return FeatureImportanceResponse(features=feature_cols, importances=importances)


# Dev server: uvicorn app:app --reload

