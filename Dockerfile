# Stage 1: Build React frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Python runtime
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY app.py features.py train.py ./

# Copy model schema (tracked in git)
COPY models/features.json ./models/

# Train the model at build time (downloads SPY data from Yahoo Finance)
RUN python train.py

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8000

# Use $PORT if set (Render), otherwise default to 8000
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
