"""Pluggable face-detection / embedding backend.

A backend produces a fixed-length numeric embedding from a face image and
reports whether the input even contained a face. Verification (comparing two
embeddings) lives in the service layer because it's the same for every
backend - they only differ in how they produce the embedding.

To add a new backend (e.g. deepface, insightface, AWS Rekognition), implement
this Protocol and register it in `backends/__init__.py`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

import numpy as np


@dataclass(frozen=True)
class Embedding:
    """One face's numeric fingerprint.

    `vector` is L2-normalised so the cosine distance between two embeddings
    equals 1 - cos_sim and lives in [0, 2].
    """

    vector: np.ndarray
    face_detected: bool
    quality: float = 1.0      # 0..1 - how usable the input was
    backend: str = "unknown"


class FaceBackend(Protocol):
    """What every face backend implementation must provide."""

    name: str

    def embed(self, image_b64: str) -> Embedding:
        """Decode the base64 image and return its embedding."""
        ...

    @property
    def dim(self) -> int:
        """Length of the embedding vector this backend produces."""
        ...
