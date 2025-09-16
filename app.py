from __future__ import annotations

import json
from pathlib import Path
from typing import Dict

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


PROJECT_ROOT = Path(__file__).resolve().parent
MODELS_DIR = PROJECT_ROOT / "models"


class PredictRequest(BaseModel):
    sma_10: float = Field(..., description="10-day simple moving average")
    sma_50: float = Field(..., description="50-day simple moving average")
    daily_return: float = Field(..., description="Daily return as decimal")
    rsi: float = Field(..., description="Relative Strength Index")


class PredictResponse(BaseModel):
    prediction: str
    prob_up: float


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
        # Maintain feature order using saved schema
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


# Dev server: uvicorn app:app --reload

