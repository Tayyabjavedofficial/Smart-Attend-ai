"""Stub face backend.

Deterministic, no ML dependencies, works on any machine. Useful for:
  - Development without GPU/heavy ML libraries
  - CI test runs
  - Showing the end-to-end flow before the real model is wired up

How it 'works': we hash the input bytes into a fixed-length numpy vector and
L2-normalise it. Identical inputs → identical embeddings → exact match. This
is the right behaviour for a stub because it gives meaningful test coverage:
the same enrollment image always verifies, two different images never do.
"""

from __future__ import annotations

import base64
import hashlib

import numpy as np

from .base import Embedding, FaceBackend


class StubFaceBackend(FaceBackend):
    name = "stub"

    def __init__(self, embedding_dim: int = 128) -> None:
        self._dim = embedding_dim

    @property
    def dim(self) -> int:
        return self._dim

    def embed(self, image_b64: str) -> Embedding:
        # Strip any data-URL prefix.
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        try:
            raw = base64.b64decode(image_b64, validate=False)
        except Exception:
            raw = image_b64.encode("utf-8", errors="ignore")

        if len(raw) < 16:
            # Treat tiny inputs as "no face detected".
            zeros = np.zeros(self._dim, dtype=np.float32)
            return Embedding(vector=zeros, face_detected=False, quality=0.0, backend=self.name)

        # Stretch the SHA-256 hash into `dim` signed floats via repeated
        # hashing. We interpret the bytes as INT32 (signed) so values are
        # centred around 0 - otherwise all-positive vectors all point in
        # roughly the same direction and different inputs collide.
        rng_seed = hashlib.sha256(raw).digest()
        buf = bytearray()
        counter = 0
        while len(buf) < self._dim * 4:
            buf.extend(hashlib.sha256(rng_seed + counter.to_bytes(4, "little")).digest())
            counter += 1
        vec = np.frombuffer(bytes(buf[: self._dim * 4]), dtype=np.int32).astype(np.float32)
        vec = vec / np.linalg.norm(vec)  # L2-normalise

        # Quality is a function of input size - bigger = more confident it was a real image.
        quality = float(min(1.0, len(raw) / 16_000))
        return Embedding(vector=vec, face_detected=True, quality=quality, backend=self.name)
