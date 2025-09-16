# UPvestment
Started March 2025, Uploaded all local commits Sep 2025
UPvestment is a machine learning–driven web app that predicts short-term S&P 500 market trends to assist investment decisions. It trains a RandomForest model on engineered technical features and serves predictions via FastAPI.

## Features
- Data download from Kaggle via `kagglehub` (dataset: `andrewmvd/sp-500-stocks`)
- Feature engineering: daily return, SMA(10), SMA(50), RSI(14)
- Binary trend label (next-day up/down)
- Chronological train/test split, evaluation, and artifact saving
- FastAPI service with `/predict` endpoint
- Visualization of feature importance and predicted vs actual trend
- Deployment configs for Gunicorn + Nginx on AWS EC2

## Project Structure
```
Upvestment Project/
├─ app.py
├─ features.py
├─ train.py
├─ visualize.py
├─ requirements.txt
├─ data/
├─ models/
├─ reports/
└─ deploy/
```

## Setup
- Python 3.10+
- Install dependencies:
```bash
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Kaggle credentials
Set up Kaggle API credentials so `kagglehub` can download datasets.
- Create an API token in your Kaggle account (Account > API > Create New Token).
- Place `kaggle.json` in one of the supported locations (e.g., `%USERPROFILE%/.kaggle/kaggle.json`).

## Train
```bash
python train.py
```
Artifacts will be saved to `models/model.pkl`, `models/features.json`, `reports/metrics.json`, and processed data to `data/processed.parquet`.

## Run API locally
```bash
uvicorn app:app --reload
```
- GET `/` returns a welcome message and feature schema
- POST `/predict` accepts JSON body:
```json
{
  "sma_10": 4520.5,
  "sma_50": 4495.1,
  "daily_return": 0.0031,
  "rsi": 57.4
}
```
Response:
```json
{
  "prediction": "Up",
  "prob_up": 0.63
}
```

## Visualizations
```bash
python visualize.py
```
Saves plots under `reports/figures/`.

## Deployment (AWS EC2)
1. SSH to your Ubuntu EC2 instance and install system packages:
```bash
sudo apt update && sudo apt install -y python3-venv python3-pip nginx
```
2. Place project under `/opt/upvestment`, then:
```bash
cd /opt/upvestment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python train.py  # to produce model artifacts
```
3. Gunicorn service:
- Copy `deploy/upvestment.service` to `/etc/systemd/system/upvestment.service` and adjust `User` and paths if needed.
```bash
sudo systemctl daemon-reload
sudo systemctl enable upvestment
sudo systemctl start upvestment
sudo systemctl status upvestment
```
4. Nginx:
- Copy `deploy/nginx.conf` to `/etc/nginx/sites-available/upvestment` and symlink to `sites-enabled`.
```bash
sudo ln -s /etc/nginx/sites-available/upvestment /etc/nginx/sites-enabled/upvestment
sudo nginx -t && sudo systemctl restart nginx
```
You should now have the API on port 80 via Nginx.

## Notes
- If the dataset does not include the S&P index or SPY directly, the training script constructs an equal-weighted proxy from the constituents.
- For reproducibility, a fixed random seed is used.
- Ensure that no future leakage occurs by keeping chronological splits.


