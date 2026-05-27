"""Backend factory.

Chooses the right FaceBackend based on settings, gracefully falling back to
the stub backend if the requested backend's optional dependencies aren't
installed. We log a clear warning so this can't surprise an operator.
"""

from __future__ import annotations

import logging

from ..config import settings
from .base import FaceBackend
from .stub import StubFaceBackend

log = logging.getLogger(__name__)


def build_face_backend() -> FaceBackend:
    name = (settings.face_backend or "stub").lower()

    if name == "opencv":
        try:
            from .opencv import OpenCVFaceBackend
            log.info("Using OpenCVFaceBackend (real face detection)")
            return OpenCVFaceBackend(embedding_dim=settings.embedding_dim)
        except Exception as e:
            log.warning(
                "face_backend=opencv selected but unavailable (%s). Falling back to stub.", e
            )

    if name not in ("stub", "opencv"):
        log.warning("Unknown face_backend=%r, falling back to stub.", name)

    log.info("Using StubFaceBackend (deterministic, no ML deps)")
    return StubFaceBackend(embedding_dim=settings.embedding_dim)
