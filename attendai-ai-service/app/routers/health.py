"""Health / liveness endpoint.

Unprotected on purpose - Kubernetes / Docker / load balancers need to probe
this without a service key.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Depends

from ..config import settings
from ..deps import get_face_backend, get_store
from ..backends.base import FaceBackend
from ..services.embedding_store import EmbeddingStore

router = APIRouter(tags=["health"])
_START = time.time()


@router.get("/health")
def health(
    backend: FaceBackend = Depends(get_face_backend),
    store: EmbeddingStore = Depends(get_store),
) -> dict:
    return {
        "status": "ok",
        "service": settings.service_name,
        "version": settings.version,
        "face_backend": backend.name,
        "embedding_dim": backend.dim,
        "registered_profiles": store.count(),
        "uptime_seconds": int(time.time() - _START),
    }
