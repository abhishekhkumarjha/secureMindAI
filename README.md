# SecureMind AI - Machine Learning Module

This repository contains the SecureMind AI machine learning module for cybersecurity threat detection.

## Structure

- `ai_models/config.py` - Dataset/model path configuration and environment overrides.
- `ai_models/preprocessing/` - Data loaders and preprocessing pipelines for CICIDS2017, UNSW-NB15, and user behavior data.
- `ai_models/models/` - Threat classification, anomaly detection, and suspicious login detection models.
- `ai_models/services/` - FastAPI-compatible prediction service layer.
- `ai_models/evaluation/` - Evaluation report generation and plotting utilities.
- `ai_models/trained_models/` - Output folder for serialized models.

## Quick Start 

1. Place CSV datasets in `datasets/` or set environment variables in `.env`.
2. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
   For the optional TensorFlow LSTM login model (Python 3.10-3.12):
   ```bash
   pip install -r requirements-optional.txt
   ```
3. Install UI dependencies:
   ```bash
   cd ui && npm install && npm run build && cd ..
   ```
4. Train models:
   ```bash
   python -m ai_models.train
   ```
5. Start development server:
   ```bash
   uvicorn app:app --reload
   ```
6. Access at `http://127.0.0.1:8000`

## Production Deployment

### Docker Deployment 

```bash
# Build and start with docker-compose
docker-compose up -d

# Check health
curl http://localhost:8000/api/health

# View logs
docker-compose logs -f securemind-api
```

### Configuration

Create a `.env` file with production values:

```env
DEBUG=false
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
```

**Important**: Change `SECRET_KEY` to a secure random value in production.

### Full Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production setup including:
- Nginx reverse proxy configuration
- HTTPS/TLS setup
- Kubernetes deployment
- Monitoring and health checks
- Backup and recovery procedures
- Performance tuning

## Prediction API

- `GET /api/health` - Health check with model status
- `GET /api/models/status` - Detailed model availability
- `POST /api/predict/threat` - Threat classification (40 features)
- `POST /api/predict/anomaly` - Anomaly detection (39 features)
- `POST /api/predict/login` - Login behavior detection

## API Documentation

- **Interactive API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`


## Demo Video: https://1drv.ms/v/c/50ACD056033FBCD8/IQDYzanPDCMER5z4tFt1GgAUAYZV3pYs5y3eCCOACxfkPPs?e=XKgtAt

