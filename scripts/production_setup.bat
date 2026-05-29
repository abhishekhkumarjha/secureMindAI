@echo off
REM Production setup script for SecureMind AI (Windows)

echo === SecureMind AI Production Setup ===
echo.

REM Check Docker installation
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker-compose is not installed. Please install Docker Desktop first.
    exit /b 1
)

echo [OK] Docker and docker-compose found
echo.

REM Check if datasets exist
echo [*] Checking datasets...
if not exist "datasets\threat_detection\cicids2017_cleaned.csv" (
    echo WARNING: cicids2017_cleaned.csv not found. Threat model training will fail.
)

if not exist "datasets\anomaly_detection\UNSW_NB15.csv" (
    echo WARNING: UNSW_NB15.csv not found. Anomaly model training will fail.
)

if not exist "datasets\login_behavior\user_behavior.csv" (
    echo WARNING: user_behavior.csv not found. Login model training will fail.
)

REM Create environment file if it doesn't exist
if not exist ".env" (
    echo [*] Creating .env from .env.production...
    copy .env.production .env
    echo WARNING: Please update .env with your production settings
    echo.
)

REM Build Docker image
echo [*] Building Docker image...
call docker-compose build
if errorlevel 1 (
    echo ERROR: Docker build failed
    exit /b 1
)

REM Check if models exist
if not exist "ai_models\trained_models\threat_best_model.joblib" (
    echo [*] Training models inside container...
    call docker-compose run --rm securemind-api python -m ai_models.train
) else (
    echo [OK] Models already trained
)

REM Start services
echo [*] Starting services...
call docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    exit /b 1
)

echo.
echo [OK] Setup complete!
echo.
echo === Next Steps ===
echo 1. Verify the service: curl http://localhost:8000/api/health
echo 2. API docs: http://localhost:8000/docs
echo 3. View logs: docker-compose logs -f securemind-api
echo 4. Stop service: docker-compose down
echo.
pause
