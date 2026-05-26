# SecureMind AI - Machine Learning Module

This repository contains the SecureMind AI machine learning module for cybersecurity threat detection.

## Structure

- `ai_models/config.py` - Dataset/model path configuration and environment overrides.
- `ai_models/preprocessing/` - Data loaders and preprocessing pipelines for CICIDS2017, UNSW-NB15, and user behavior data.
- `ai_models/models/` - Threat classification, anomaly detection, and suspicious login detection models.
- `ai_models/services/` - FastAPI-compatible prediction service layer.
- `ai_models/evaluation/` - Evaluation report generation and plotting utilities.
- `ai_models/trained_models/` - Output folder for serialized models.

## Usage

1. Place CSV datasets in `ai_models/datasets/` or set environment variables in `.env.example`.
2. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
   For the optional TensorFlow LSTM login model, use Python 3.10-3.12 and install:
   ```bash
   pip install -r requirements-optional.txt
   ```
3. Install the UI dependencies:
   ```bash
   cd ui
   npm install
   ```
4. Build the React UI:
   ```bash
   npm run build
   ```
5. Train the models after adding the datasets:
   ```bash
   python -m ai_models.train
   ```
6. Start the SecureMind UI backend:
   ```bash
   cd ..
   uvicorn app:app --reload
   ```
7. Open the browser at `http://127.0.0.1:8000` to use the integrated SecureMind UI.

## Prediction API

- `GET /api/health`
- `GET /api/models/status`
- `POST /api/predict/threat` with `{ "features": [number, ...] }`
- `POST /api/predict/anomaly` with `{ "features": [number, ...] }`
- `POST /api/predict/login` with login behavior fields

Each returns a JSON-compatible dictionary with `prediction`, `confidence`, and `risk_score`.

The React UI includes an AI Model Console in the Threats page that calls all three prediction endpoints. If model artifacts are missing, the API returns `503` and the UI shows a training reminder instead of failing silently.
