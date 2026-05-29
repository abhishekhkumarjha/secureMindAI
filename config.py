"""Production configuration management for SecureMind AI."""
from __future__ import annotations
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # API Configuration
    api_host: str = os.getenv("API_HOST", "127.0.0.1")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # CORS Configuration
    allowed_origins: List[str] = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost,http://127.0.0.1").split(",")
    ]

    # Rate Limiting
    rate_limit_enabled: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    rate_limit_period: int = int(os.getenv("RATE_LIMIT_PERIOD", "3600"))

    # Model paths
    ai_dataset_dir: str = os.getenv("AI_DATASET_DIR", "./datasets")
    ai_models_dir: str = os.getenv("AI_MODELS_DIR", "./ai_models/trained_models")

    # Security
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")

    class Config:
        env_file = ".env.production"
        case_sensitive = False


settings = Settings()
