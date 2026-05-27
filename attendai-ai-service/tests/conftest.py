"""Shared pytest fixtures.

We point the service at a tmp directory and use the stub backend so tests run
fast and deterministically. The service-key check is exercised by default by
sending the header.
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest


@pytest.fixture(autouse=True)
def _isolate_storage(tmp_path: Path, monkeypatch):
    storage = tmp_path / "embeddings"
    storage.mkdir()
    # We mutate the existing settings object rather than replacing it,
    # because other modules already captured the reference via
    # `from .config import settings`.
    from app.config import settings
    from app import deps

    monkeypatch.setattr(settings, "storage_dir", storage)
    monkeypatch.setattr(settings, "face_backend", "stub")
    monkeypatch.setattr(settings, "service_key", "test-key")

    # Reset the cached dep singletons so they re-read the patched settings.
    deps.get_face_backend.cache_clear()
    deps.get_store.cache_clear()
    deps.get_face_service.cache_clear()
    yield
    deps.get_face_backend.cache_clear()
    deps.get_store.cache_clear()
    deps.get_face_service.cache_clear()


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)


@pytest.fixture()
def auth_headers():
    return {"X-Service-Key": "test-key"}


@pytest.fixture()
def sample_image_b64() -> str:
    """A deterministic 'image' big enough for the stub backend to accept."""
    return ("A" * 256).encode().hex()  # 512 hex chars - well above the 16-byte minimum
