#!/bin/bash
# Production setup script for SecureMind AI

set -e

echo "=== SecureMind AI Production Setup ==="

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "[✓] Docker and docker-compose found"

# Check if datasets exist
echo "[*] Checking datasets..."
if [ ! -f "datasets/threat_detection/cicids2017_cleaned.csv" ]; then
    echo "WARNING: cicids2017_cleaned.csv not found. Threat model training will fail."
fi

if [ ! -f "datasets/anomaly_detection/UNSW_NB15.csv" ]; then
    echo "WARNING: UNSW_NB15.csv not found. Anomaly model training will fail."
fi

if [ ! -f "datasets/login_behavior/user_behavior.csv" ]; then
    echo "WARNING: user_behavior.csv not found. Login model training will fail."
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "[*] Creating .env from .env.production..."
    cp .env.production .env
    echo "WARNING: Please update .env with your production settings, especially SECRET_KEY and ALLOWED_ORIGINS"
fi

# Build Docker image
echo "[*] Building Docker image..."
docker-compose build

# Train models if needed
echo "[*] Checking if models exist..."
if [ ! -f "ai_models/trained_models/threat_best_model.joblib" ]; then
    echo "[*] Training models inside container..."
    docker-compose run --rm securemind-api python -m ai_models.train
else
    echo "[✓] Models already trained"
fi

# Start services
echo "[*] Starting services..."
docker-compose up -d

echo "[✓] Setup complete!"
echo ""
echo "=== Next Steps ==="
echo "1. Verify the service is running: curl http://localhost:8000/api/health"
echo "2. Access API docs: http://localhost:8000/docs"
echo "3. View logs: docker-compose logs -f securemind-api"
echo "4. Stop service: docker-compose down"
echo ""
echo "For production deployment, update .env with your configuration and use a reverse proxy (nginx) with TLS."
