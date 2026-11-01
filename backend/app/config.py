"""
Application Configuration and Settings
--------------------------------------
Configures environment variables, upload limits, model artifact paths,
and database connections using Pydantic Settings.
"""

import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Synthetic Voice & Audio Spoof Detection System"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Security & File Limits
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: str = ".wav,.mp3,.flac,.ogg,.m4a,.webm"

    # Deep Learning Artifacts
    MODEL_WEIGHTS_PATH: str = "backend/artifacts/best_model.pt"
    BASELINE_WEIGHTS_PATH: str = "backend/artifacts/baseline_cnn.pt"
    MODEL_CONFIG_PATH: str = "backend/artifacts/model_config.json"
    PREPROCESSING_CONFIG_PATH: str = "backend/artifacts/preprocessing_config.json"
    METRICS_PATH: str = "backend/artifacts/metrics.json"
    EVALUATION_RESULTS_DIR: str = "experiments/evaluation_results"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./synthetic_voice.db"

    # Audio Storage & Temporary Files
    STORE_UPLOADED_AUDIO: bool = False
    UPLOAD_TEMP_DIR: str = "./tmp_audio"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_extensions_set(self) -> set:
        return {ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()}


settings = Settings()
os.makedirs(settings.UPLOAD_TEMP_DIR, exist_ok=True)
