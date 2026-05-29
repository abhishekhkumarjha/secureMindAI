# SecureMind AI - Deployment Guide

## Production Deployment

This guide covers deploying SecureMind AI to production using Docker and docker-compose.

### Prerequisites

- Docker 20.10+
- docker-compose 2.0+
- 4GB+ RAM
- 20GB+ disk space for models and datasets

### Quick Start with Docker

#### 1. Build and Run with docker-compose

```bash
# Clone the repository
git clone https://github.com/abhishekhkumarjha/secureMindAI.git
cd secureMindAI

# Copy production environment
cp .env.production .env

# Update .env with your configuration
# Important: Change SECRET_KEY and ALLOWED_ORIGINS

# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f securemind-api

# Check health
curl http://localhost:8000/api/health
```

#### 2. Stop the Service

```bash
docker-compose down
```

### Configuration

#### Environment Variables

Create a `.env` file based on `.env.production`:

```env
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false
LOG_LEVEL=INFO

ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=3600

SECRET_KEY=your-secure-random-key-here
```

**Critical Security Notes:**
- Change `SECRET_KEY` to a secure random string (use `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- Set `ALLOWED_ORIGINS` to your actual domain(s)
- Set `DEBUG=false` in production
- Use HTTPS in production (configure reverse proxy)

### Training Models

Models must be trained before the API can serve predictions.

#### Option 1: Train Inside Container

```bash
# Run training in the container
docker-compose exec securemind-api python -m ai_models.train
```

#### Option 2: Train Before Deployment

```bash
# Ensure datasets are in place
ls datasets/anomaly_detection/UNSW_NB15.csv
ls datasets/login_behavior/user_behavior.csv
ls datasets/threat_detection/cicids2017_cleaned.csv

# Train locally (requires Python 3.10+)
pip install -r requirements.txt
python -m ai_models.train

# Then build and deploy Docker image
docker-compose up -d
```

### Health Checks and Monitoring

#### API Health Endpoint

```bash
curl http://localhost:8000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-05-29T10:30:00Z",
  "models": {
    "threat": { "ready": true, "missing": [] },
    "anomaly": { "ready": true, "missing": [] },
    "login": { "ready": true, "missing": [] }
  }
}
```

#### View Logs

```bash
# Real-time logs
docker-compose logs -f securemind-api

# Last 100 lines
docker-compose logs --tail 100 securemind-api

# Application logs
docker exec securemind-api tail -f /app/logs/securemind.log

# Error logs
docker exec securemind-api tail -f /app/logs/errors.log
```

### Production Recommendations

#### 1. Reverse Proxy (nginx)

```nginx
upstream securemind_api {
    server localhost:8000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    location / {
        proxy_pass http://securemind_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

#### 2. Scale with Multiple Workers

Update `docker-compose.yml`:

```yaml
services:
  securemind-api:
    environment:
      - API_WORKERS=8  # Adjust based on CPU cores
```

#### 3. Volume Management

Persist trained models and logs:

```bash
# Create volumes
docker volume create securemind-models
docker volume create securemind-logs

# Update docker-compose.yml to use volumes
volumes:
  securemind-models:
  securemind-logs:
```

#### 4. Monitoring

Monitor container health:

```bash
# View container stats
docker stats securemind-api

# Check for restarts
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RestartCount}}"
```

#### 5. Backup Models

```bash
# Backup trained models
docker run --rm -v securemind-api_app:/app \
  -v /backup:/backup \
  ubuntu tar czf /backup/models-$(date +%Y%m%d).tar.gz \
  /app/ai_models/trained_models

# Restore models
docker run --rm -v securemind-api_app:/app \
  -v /backup:/backup \
  ubuntu tar xzf /backup/models-20240529.tar.gz -C /app
```

### Troubleshooting

#### API Not Starting

```bash
# Check logs
docker-compose logs securemind-api

# Check port availability
netstat -an | grep 8000

# Restart service
docker-compose restart securemind-api
```

#### Model Loading Errors

```bash
# Verify models exist
docker exec securemind-api ls -lah ai_models/trained_models/

# Check model status
curl http://localhost:8000/api/models/status
```

#### Out of Memory

Increase Docker memory limit in `docker-compose.yml`:

```yaml
services:
  securemind-api:
    mem_limit: 8g
    memswap_limit: 8g
```

### API Documentation

Once deployed, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### Performance Tuning

- **Workers**: Set based on CPU cores (2-4 per core)
- **Timeouts**: Increase `--timeout` in Dockerfile for larger models
- **Rate Limiting**: Adjust `RATE_LIMIT_REQUESTS` and `RATE_LIMIT_PERIOD` as needed
- **Logging**: Set `LOG_LEVEL=WARNING` in production to reduce I/O

### Security Checklist

- [ ] Changed `SECRET_KEY` to a secure value
- [ ] Set `DEBUG=false`
- [ ] Configured `ALLOWED_ORIGINS` for CORS
- [ ] Using HTTPS/TLS in production
- [ ] Running with non-root user (handled in Dockerfile)
- [ ] Using secrets management for sensitive data
- [ ] Regular backups of models and logs
- [ ] Monitoring and alerting configured

### Support and Issues

For issues or questions, please visit: https://github.com/abhishekhkumarjha/secureMindAI/issues
