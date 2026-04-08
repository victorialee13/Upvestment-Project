from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from features import compute_rsi, compute_macd, compute_bollinger_width

# Simple in-memory cache for live indicators (avoids hammering Yahoo Finance)
_live_cache: dict = {}
_CACHE_TTL = timedelta(minutes=15)


PROJECT_ROOT = Path(__file__).resolve().parent
MODELS_DIR = PROJECT_ROOT / "models"


class PredictRequest(BaseModel):
    sma_10_ratio: float = Field(..., description="Price deviation from SMA-10 (close/sma_10 - 1)")
    sma_50_ratio: float = Field(..., description="Price deviation from SMA-50 (close/sma_50 - 1)")
    daily_return: float = Field(..., description="Daily return as decimal")
    rsi: float = Field(..., ge=0, le=100, description="Relative Strength Index (0–100)")
    macd_pct: float = Field(..., description="MACD line as fraction of price")
    macd_signal_pct: float = Field(..., description="MACD signal line as fraction of price")
    bb_width: float = Field(..., description="Bollinger Band width normalised by mid band")
    volatility_20: float = Field(..., description="20-day rolling std of daily returns")
    momentum_5: float = Field(..., description="5-day price momentum")


class PredictResponse(BaseModel):
    prediction: str
    prob_up: float


class LiveIndicatorsResponse(BaseModel):
    # Raw display values
    sma_10: float
    sma_50: float
    daily_return: float
    rsi: float
    macd: float
    bb_width: float
    volatility_20: float
    momentum_5: float
    price: float
    as_of: str
    # Normalised model inputs
    sma_10_ratio: float
    sma_50_ratio: float
    macd_pct: float
    macd_signal_pct: float


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


@app.get("/health")
def health() -> Dict:
    cached_as_of = _live_cache.get("as_of")
    cache_age_s = None
    if "ts" in _live_cache:
        cache_age_s = round((datetime.now() - _live_cache["ts"]).total_seconds())
    return {
        "status": "ok",
        "model": type(model).__name__,
        "features": len(feature_cols),
        "cache_age_seconds": cache_age_s,
        "last_data_date": cached_as_of,
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
    # Return cached result if still fresh
    if "data" in _live_cache and (datetime.now() - _live_cache["ts"]) < _CACHE_TTL:
        return _live_cache["data"]

    try:
        ticker = yf.Ticker("SPY")
        # Fetch 120 days to cover SMA-50, MACD, Bollinger, and volatility warmup
        df = ticker.history(period="120d")
        if df.empty:
            raise HTTPException(status_code=503, detail="No data returned from Yahoo Finance.")

        close = df["Close"]
        ret = close.pct_change()

        sma_10_s = close.rolling(10, min_periods=10).mean()
        sma_50_s = close.rolling(50, min_periods=50).mean()
        sma_10 = float(sma_10_s.iloc[-1])
        sma_50 = float(sma_50_s.iloc[-1])
        daily_return = float(ret.iloc[-1])
        rsi = float(compute_rsi(close, window=14).iloc[-1])
        macd_line, signal_line = compute_macd(close)
        macd = float(macd_line.iloc[-1])
        macd_sig = float(signal_line.iloc[-1])
        bb_width = float(compute_bollinger_width(close, window=20).iloc[-1])
        volatility_20 = float(ret.rolling(20, min_periods=20).std().iloc[-1])
        momentum_5 = float(close.pct_change(5).iloc[-1])
        price = float(close.iloc[-1])
        as_of = str(df.index[-1].date())

        # Normalised features (matching training)
        sma_10_ratio = price / sma_10 - 1
        sma_50_ratio = price / sma_50 - 1
        macd_pct = macd / price
        macd_signal_pct = macd_sig / price

        result = LiveIndicatorsResponse(
            sma_10=round(sma_10, 4),
            sma_50=round(sma_50, 4),
            daily_return=round(daily_return, 6),
            rsi=round(rsi, 2),
            macd=round(macd, 4),
            bb_width=round(bb_width, 6),
            volatility_20=round(volatility_20, 6),
            momentum_5=round(momentum_5, 6),
            price=round(price, 2),
            as_of=as_of,
            sma_10_ratio=round(sma_10_ratio, 6),
            sma_50_ratio=round(sma_50_ratio, 6),
            macd_pct=round(macd_pct, 8),
            macd_signal_pct=round(macd_signal_pct, 8),
        )
        _live_cache["data"] = result
        _live_cache["ts"] = datetime.now()
        _live_cache["as_of"] = as_of
        return result
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

