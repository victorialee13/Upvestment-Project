from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import numpy as np
import pandas as pd


@dataclass(frozen=True)
class IndicatorConfig:
    rsi_window: int = 14
    sma_short_window: int = 10
    sma_long_window: int = 50


def _ensure_datetime_sorted(df: pd.DataFrame, date_col: str = "date") -> pd.DataFrame:
    """Ensure a `date` column of dtype datetime and sort ascending by date."""
    df = df.copy()
    if date_col not in df.columns:
        # Try common variants
        for candidate in ("Date", "DATE", "timestamp", "Timestamp"):
            if candidate in df.columns:
                df[date_col] = df[candidate]
                break
        else:
            raise KeyError("No date column found. Expected one of ['date','Date','timestamp','Timestamp']")

    df[date_col] = pd.to_datetime(df[date_col], errors="coerce", utc=False)
    df = df.dropna(subset=[date_col])
    df = df.sort_values(date_col).reset_index(drop=True)
    return df


def compute_rsi(close: pd.Series, window: int = 14) -> pd.Series:
    """Compute Relative Strength Index (RSI).

    Uses Wilder's smoothing by EMA on gains and losses.
    Returns RSI aligned with `close` series (NaN for the first `window` rows).
    """
    delta = close.diff()
    gain = delta.clip(lower=0.0)
    loss = -delta.clip(upper=0.0)

    avg_gain = gain.ewm(alpha=1 / window, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / window, adjust=False).mean()

    rs = avg_gain / (avg_loss.replace(0, np.nan))
    rsi = 100 - (100 / (1 + rs))
    return rsi


def add_indicators(df: pd.DataFrame, cfg: IndicatorConfig = IndicatorConfig(),
                   date_col: str = "date", close_col: str = "close") -> pd.DataFrame:
    """Add daily return, SMAs, and RSI to a price DataFrame.

    Expects columns: `date`, `close` (case-insensitive variants tolerated).
    """
    df = df.copy()

    # Normalize column names
    rename_map = {}
    for c in df.columns:
        lc = c.lower()
        if lc == "close" and close_col not in df.columns:
            rename_map[c] = close_col
        if lc == "date" and date_col not in df.columns:
            rename_map[c] = date_col
    if rename_map:
        df = df.rename(columns=rename_map)

    df = _ensure_datetime_sorted(df, date_col)

    # Forward-fill to handle gaps
    df[close_col] = pd.to_numeric(df[close_col], errors="coerce")
    df[close_col] = df[close_col].ffill()

    # Indicators
    df["daily_return"] = df[close_col].pct_change()
    df["sma_10"] = df[close_col].rolling(cfg.sma_short_window, min_periods=cfg.sma_short_window).mean()
    df["sma_50"] = df[close_col].rolling(cfg.sma_long_window, min_periods=cfg.sma_long_window).mean()
    df["rsi"] = compute_rsi(df[close_col], window=cfg.rsi_window)

    # Clean head NaNs introduced by indicators
    min_warmup = max(cfg.sma_long_window, cfg.rsi_window) + 1
    df = df.iloc[min_warmup:].reset_index(drop=True)
    return df


def add_trend_label(df: pd.DataFrame, close_col: str = "close") -> pd.DataFrame:
    """Create binary label `trend`: 1 if next-day close > today close, else 0."""
    df = df.copy()
    next_close = df[close_col].shift(-1)
    df["trend"] = (next_close > df[close_col]).astype(int)
    # Drop last row without a next day label
    df = df.iloc[:-1].reset_index(drop=True)
    return df


def prepare_features(df: pd.DataFrame, feature_cols: Tuple[str, ...] = ("sma_10", "sma_50", "daily_return", "rsi")) -> Tuple[pd.DataFrame, pd.Series]:
    """Return X (features) and y (labels) from a labeled DataFrame."""
    missing = [c for c in feature_cols if c not in df.columns]
    if missing:
        raise KeyError(f"Missing features in DataFrame: {missing}")
    if "trend" not in df.columns:
        raise KeyError("Missing 'trend' label column. Call add_trend_label first.")
    X = df.loc[:, list(feature_cols)].astype(float)
    y = df["trend"].astype(int)
    # Drop any rows with NaNs that may remain
    valid = ~X.isna().any(axis=1)
    X = X.loc[valid]
    y = y.loc[valid]
    return X, y


def chronological_train_test_split(df: pd.DataFrame, test_size: float = 0.2,
                                   date_col: str = "date") -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split a time-ordered DataFrame into chronological train and test partitions."""
    df = _ensure_datetime_sorted(df, date_col)
    n = len(df)
    split_idx = int(n * (1 - test_size))
    train_df = df.iloc[:split_idx].reset_index(drop=True)
    test_df = df.iloc[split_idx:].reset_index(drop=True)
    return train_df, test_df


