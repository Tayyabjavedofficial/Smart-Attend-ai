"""Application dependencies.

Single instance of FaceBackend / EmbeddingStore / FaceService is built at
startup and exposed through FastAPI's `Depends`. This keeps the heavy work
(model loading, file handles) out of the hot path.
"""

from __future__ import annotations

from functools import lru_cache

from .backends import build_face_backend
from .backends.base import FaceBackend
from .config import settings
from .services.embedding_store import EmbeddingStore
from .services.face_service import FaceService


@lru_cache(maxsize=1)
def get_face_backend() -> FaceBackend:
    return build_face_backend()


@lru_cache(maxsize=1)
def get_store() -> EmbeddingStore:
    return EmbeddingStore(settings.storage_dir)


@lru_cache(maxsize=1)
def get_face_service() -> FaceService:
    return FaceService(get_face_backend(), get_store())
