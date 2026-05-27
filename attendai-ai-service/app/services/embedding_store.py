"""Persistent storage for face profiles.

A profile is the average of N enrollment embeddings plus metadata. We store
each student's profile as two files on disk:

    storage/embeddings/{student_id}.npy   # the embedding vector
    storage/embeddings/{student_id}.json  # metadata (samples, backend, created_at)

The store is wrapped behind a class so it can be swapped for a database-
backed implementation later without touching service code.
"""

from __future__ import annotations

import json
import logging
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np

log = logging.getLogger(__name__)


@dataclass
class StoredProfile:
    student_id: int
    vector: np.ndarray
    profile_id: str
    samples_count: int
    quality_score: float
    backend: str
    created_at: datetime
    metadata: dict[str, Any]


class EmbeddingStore:
    """Reads / writes face profiles from disk. Thread-safe within a process."""

    def __init__(self, storage_dir: Path):
        self._dir = storage_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()

    # -- paths --

    def _vec_path(self, student_id: int) -> Path:
        return self._dir / f"{student_id}.npy"

    def _meta_path(self, student_id: int) -> Path:
        return self._dir / f"{student_id}.json"

    # -- public --

    def exists(self, student_id: int) -> bool:
        return self._vec_path(student_id).exists() and self._meta_path(student_id).exists()

    def save(self, profile: StoredProfile) -> None:
        with self._lock:
            np.save(self._vec_path(profile.student_id), profile.vector)
            meta = {
                "profile_id": profile.profile_id,
                "student_id": profile.student_id,
                "samples_count": profile.samples_count,
                "quality_score": profile.quality_score,
                "backend": profile.backend,
                "created_at": profile.created_at.isoformat(),
                "metadata": profile.metadata,
            }
            self._meta_path(profile.student_id).write_text(json.dumps(meta, indent=2))
        log.info(
            "Saved profile %s for student %d (samples=%d, backend=%s)",
            profile.profile_id, profile.student_id, profile.samples_count, profile.backend,
        )

    def load(self, student_id: int) -> StoredProfile | None:
        with self._lock:
            if not self.exists(student_id):
                return None
            vec = np.load(self._vec_path(student_id))
            meta = json.loads(self._meta_path(student_id).read_text())
            return StoredProfile(
                student_id=meta["student_id"],
                vector=vec.astype(np.float32),
                profile_id=meta["profile_id"],
                samples_count=meta["samples_count"],
                quality_score=meta["quality_score"],
                backend=meta["backend"],
                created_at=datetime.fromisoformat(meta["created_at"]),
                metadata=meta.get("metadata") or {},
            )

    def delete(self, student_id: int) -> bool:
        with self._lock:
            v = self._vec_path(student_id)
            m = self._meta_path(student_id)
            deleted = v.exists() or m.exists()
            v.unlink(missing_ok=True)
            m.unlink(missing_ok=True)
            return deleted

    def count(self) -> int:
        return len(list(self._dir.glob("*.npy")))

    @staticmethod
    def now() -> datetime:
        return datetime.now(timezone.utc)
