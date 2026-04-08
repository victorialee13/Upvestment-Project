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
    macd_fast: int = 12
    macd_slow: int = 26
    macd_signal: int = 9
    bb_window: int = 20
    volatility_window: int = 20
    momentum_window: int = 5


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


def compute_macd(
    close: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
) -> tuple[pd.Series, pd.Series]:
    """Return (macd_line, signal_line)."""
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line, signal_line


def compute_bollinger_width(close: pd.Series, window: int = 20) -> pd.Series:
    """Bollinger Band width normalised by mid band: (upper - lower) / mid."""
    mid = close.rolling(window, min_periods=window).mean()
    std = close.rolling(window, min_periods=window).std()
    upper = mid + 2 * std
    lower = mid - 2 * std
    return (upper - lower) / mid


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
    df = df.assign(**{close_col: pd.to_numeric(df[close_col], errors="coerce").ffill()})

    # Compute all indicators as independent series first
    close = df[close_col]
    daily_return = close.pct_change()
    sma_10 = close.rolling(cfg.sma_short_window, min_periods=cfg.sma_short_window).mean()
    sma_50 = close.rolling(cfg.sma_long_window, min_periods=cfg.sma_long_window).mean()
    rsi = compute_rsi(close, window=cfg.rsi_window)
    macd_line, signal_line = compute_macd(
        close, fast=cfg.macd_fast, slow=cfg.macd_slow, signal=cfg.macd_signal
    )
    bb_width = compute_bollinger_width(close, window=cfg.bb_window)
    volatility_20 = daily_return.rolling(cfg.volatility_window, min_periods=cfg.volatility_window).std()
    momentum_5 = close.pct_change(cfg.momentum_window)

    # Normalise price-level features so the model generalises across price regimes
    sma_10_ratio = close / sma_10 - 1        # % deviation of price from SMA-10
    sma_50_ratio = close / sma_50 - 1        # % deviation of price from SMA-50
    macd_pct = macd_line / close             # MACD as fraction of price
    macd_signal_pct = signal_line / close    # signal line as fraction of price

    # Assign all at once to avoid Copy-on-Write issues
    df = df.assign(
        daily_return=daily_return.values,
        sma_10=sma_10.values,
        sma_50=sma_50.values,
        sma_10_ratio=sma_10_ratio.values,
        sma_50_ratio=sma_50_ratio.values,
        rsi=rsi.values,
        macd=macd_line.values,
        macd_signal=signal_line.values,
        macd_pct=macd_pct.values,
        macd_signal_pct=macd_signal_pct.values,
        bb_width=bb_width.values,
        volatility_20=volatility_20.values,
        momentum_5=momentum_5.values,
    )

    # Clean head NaNs introduced by indicators
    min_warmup = max(cfg.sma_long_window, cfg.macd_slow + cfg.macd_signal, cfg.bb_window, cfg.volatility_window) + 1
    df = df.iloc[min_warmup:].reset_index(drop=True)
    return df


def add_trend_label(df: pd.DataFrame, close_col: str = "close") -> pd.DataFrame:
    """Create binary label `trend`: 1 if next-day close > today close, else 0."""
    df = df.copy()
    next_close = df[close_col].shift(-1)
    df = df.assign(trend=(next_close > df[close_col]).astype(int))
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


