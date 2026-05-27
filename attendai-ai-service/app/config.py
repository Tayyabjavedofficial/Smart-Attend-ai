"""Centralised settings. All env-driven, prefix ATTENDAI_AI_."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="ATTENDAI_AI_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    service_name: str = "attendai-ai"
    version: str = "0.1.0"

    # Service-to-service auth - the Spring Boot backend passes this in X-Service-Key.
    service_key: str = "dev-service-key"

    # 'stub' | 'opencv'. The stub backend has zero ML deps and is fully
    # deterministic - useful for development and CI.
    face_backend: str = "stub"

    # File-based embedding storage. Swappable.
    storage_dir: Path = Path("./storage/embeddings")

    # Verification thresholds. With L2-normalised embeddings the cosine distance
    # is in [0, 2]; lower means more similar.
    verify_threshold: float = 0.55
    low_confidence_band: float = 0.70

    embedding_dim: int = 128

    cors_origins: str = "*"


settings = Settings()
