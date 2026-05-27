"""High-level face service.

Composes:
  - a FaceBackend (the embedding model)
  - an EmbeddingStore (where profiles live)

Provides the operations the API actually exposes (register, verify, delete).
This is where the AI's "policy" lives - threshold logic, manual-review
decisions, multi-sample averaging.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass

import numpy as np

from ..backends.base import FaceBackend
from ..config import settings
from ..schemas.face import VerifyStatus
from .embedding_store import EmbeddingStore, StoredProfile

log = logging.getLogger(__name__)


@dataclass
class VerifyOutcome:
    verified: bool
    status: VerifyStatus
    confidence: float
    distance: float | None
    metadata: dict


class FaceService:
    def __init__(self, backend: FaceBackend, store: EmbeddingStore):
        self.backend = backend
        self.store = store

    # ---------------- Register ----------------

    def register(self, student_id: int, images_b64: list[str], extra_meta: dict | None = None) -> StoredProfile:
        """Build a profile by averaging the embeddings of N enrollment shots.

        Images that don't contain a face are silently rejected but counted in
        the response so the UI can complain if too many were unusable.
        """
        embeddings: list[np.ndarray] = []
        rejected = 0
        qualities: list[float] = []
        for img in images_b64:
            emb = self.backend.embed(img)
            if not emb.face_detected:
                rejected += 1
                continue
            embeddings.append(emb.vector)
            qualities.append(emb.quality)

        if not embeddings:
            # Caller should map this to a 422.
            raise ValueError("No usable face detected in any provided image")

        # Average then re-normalise. With L2-normalised inputs the mean is a
        # reasonable "prototype" embedding.
        avg = np.mean(np.stack(embeddings), axis=0)
        norm = np.linalg.norm(avg)
        if norm > 0:
            avg = avg / norm

        profile = StoredProfile(
            student_id=student_id,
            vector=avg.astype(np.float32),
            profile_id="fp_" + uuid.uuid4().hex[:12],
            samples_count=len(embeddings),
            quality_score=float(np.mean(qualities)) if qualities else 0.0,
            backend=self.backend.name,
            created_at=EmbeddingStore.now(),
            metadata={"samples_rejected": rejected, **(extra_meta or {})},
        )
        self.store.save(profile)
        return profile

    # ---------------- Verify ----------------

    def verify(self, student_id: int, image_b64: str) -> VerifyOutcome:
        profile = self.store.load(student_id)
        if profile is None:
            return VerifyOutcome(
                verified=False,
                status=VerifyStatus.FAILED,
                confidence=0.0,
                distance=None,
                metadata={"reason": "no_profile"},
            )

        emb = self.backend.embed(image_b64)
        if not emb.face_detected:
            return VerifyOutcome(
                verified=False,
                status=VerifyStatus.FAILED,
                confidence=0.0,
                distance=None,
                metadata={"reason": "no_face_detected", "backend": emb.backend},
            )

        # Cosine distance via L2-normalised vectors.
        # distance = 1 - cos(θ), in [0, 2]; lower is more similar.
        distance = float(1.0 - np.dot(profile.vector, emb.vector))

        thr = settings.verify_threshold
        low_band = settings.low_confidence_band

        if distance <= thr:
            status = VerifyStatus.VERIFIED
            verified = True
        elif distance <= low_band:
            status = VerifyStatus.LOW_CONFIDENCE
            verified = True
        else:
            status = VerifyStatus.FAILED
            verified = False

        # Map distance → confidence in [0, 1]. Anchored at the threshold so a
        # match exactly at the threshold scores 0.5.
        if distance <= 0:
            confidence = 1.0
        elif distance >= 2.0:
            confidence = 0.0
        else:
            # Piecewise: 1.0 at d=0, 0.5 at threshold, ~0 well past low band.
            if distance <= thr:
                confidence = 1.0 - 0.5 * (distance / thr)
            else:
                tail = (distance - thr) / max(1e-6, (2.0 - thr))
                confidence = max(0.0, 0.5 * (1 - tail))

        return VerifyOutcome(
            verified=verified,
            status=status,
            confidence=float(round(confidence, 4)),
            distance=float(round(distance, 4)),
            metadata={
                "backend": emb.backend,
                "face_quality": round(emb.quality, 3),
                "threshold": thr,
            },
        )

    # ---------------- Delete ----------------

    def delete(self, student_id: int) -> bool:
        return self.store.delete(student_id)
