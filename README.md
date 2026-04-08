# Upvestment

An AI-powered web application that predicts short-term S&P 500 (SPY) market trends using machine learning and live market data.

> **Disclaimer:** For educational purposes only. Not financial advice.

---

## Features

- **One-click prediction** — fetches live SPY data from Yahoo Finance and runs the model instantly
- **9 normalised technical indicators** — SMA ratios, RSI, MACD %, Bollinger Band width, volatility, momentum
- **55%+ model accuracy** — RandomForest trained on 10 years of SPY data
- **30-day backtest** — see how the model performed on the last 30 real trading days
- **Signal breakdown** — RSI level, SMA cross, daily return, and momentum interpretation
- **Feature importance chart** — see which signals drive the model's decisions
- **15-minute data cache** — avoids hammering Yahoo Finance on repeated requests
- **Advanced Mode** — manually enter all 9 indicators to test hypothetical conditions
- **Production-ready** — Docker support, env-based CORS, frontend served from FastAPI

---

## Project Structure

```
Upvestment-Project/
├── app.py               # FastAPI backend — all API endpoints
├── features.py          # Feature engineering (indicators + normalisation)
├── train.py             # Model training script
├── requirements.txt     # Python dependencies
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Single-command deployment
│
├── frontend/            # React + Vite frontend
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── InputForm.jsx        # Manual indicator form (Advanced Mode)
│       │   ├── PredictionResult.jsx # Result + signal breakdown
│       │   ├── Charts.jsx           # Feature importance bar chart
│       │   └── HistoryChart.jsx     # 30-day backtest table
│       └── services/api.js          # API client
│
├── models/              # Trained model artifacts
│   └── features.json    # Feature column schema
├── data/                # Processed datasets (gitignored)
└── reports/             # Metrics
    └── metrics.json
```

---

## Setup

### Requirements
- Python 3.10+
- Node.js 18+

### Install Python dependencies

```bash
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\Activate.ps1    # Windows PowerShell
pip install -r requirements.txt
```

### Train the model

Downloads 10 years of SPY data from Yahoo Finance and trains the model:

```bash
python train.py
```

Artifacts saved to `models/` and `reports/`.

---

## Running Locally

### Backend (Terminal 1)

```bash
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

API available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

### Frontend (Terminal 2)

```bash
cd frontend
npm install       # first time only
npm run dev
```

Frontend available at **http://localhost:5173**

> The backend must be running before you use the app — it handles live data fetching and predictions.

---

## Running with Docker

Build and run the full stack in a single container:

```bash
docker compose up --build
```

App available at **http://localhost:8000**

The React frontend is built and served directly by FastAPI — no separate server needed.

> **Note:** Train the model before building the Docker image (`python train.py`) so `models/` is populated.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message and feature schema |
| `GET` | `/health` | Model status, cache age, last data date |
| `GET` | `/live-indicators` | Fetch live SPY indicators from Yahoo Finance |
| `POST` | `/predict` | Run model prediction on provided features |
| `GET` | `/feature-importance` | Feature importances from the trained model |
| `GET` | `/backtest?days=30` | Model predictions vs actuals for last N trading days |

### POST `/predict` example

```json
// Request
{
  "sma_10_ratio": 0.003,
  "sma_50_ratio": 0.012,
  "daily_return": 0.0031,
  "rsi": 57.4,
  "macd_pct": -0.0001,
  "macd_signal_pct": -0.00008,
  "bb_width": 0.045,
  "volatility_20": 0.009,
  "momentum_5": 0.018
}

// Response
{
  "prediction": "Up",
  "prob_up": 0.63
}
```

---

## Model Details

| Property | Value |
|----------|-------|
| Algorithm | RandomForestClassifier |
| Training data | 10 years of SPY (via yfinance) |
| Features | 9 normalised technical indicators |
| Test accuracy | ~55% |
| Train/test split | 80/20 chronological |

### Features

| Feature | Description |
|---------|-------------|
| `sma_10_ratio` | Price deviation from 10-day SMA: `close/sma_10 − 1` |
| `sma_50_ratio` | Price deviation from 50-day SMA: `close/sma_50 − 1` |
| `daily_return` | Today's percentage price change |
| `rsi` | 14-day Relative Strength Index (0–100) |
| `macd_pct` | MACD line as fraction of price |
| `macd_signal_pct` | MACD signal line as fraction of price |
| `bb_width` | Bollinger Band width normalised by mid band |
| `volatility_20` | 20-day rolling standard deviation of daily returns |
| `momentum_5` | 5-day price momentum (percentage change) |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |

Set in production:
```bash
export CORS_ORIGINS=https://yourdomain.com
```

---

## Deployment (AWS EC2)

1. SSH to your Ubuntu instance and install dependencies:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
```

2. Clone the repo, train the model, then:
```bash
docker compose up --build -d
```

3. Set up Nginx to reverse proxy port 80 → 8000 if needed.
