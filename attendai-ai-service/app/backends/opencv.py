"""OpenCV-based face backend.

Real face detection via OpenCV's built-in Haar cascade (no model download
needed - it ships with opencv-python). For the embedding we compute a
multi-region grayscale histogram of the detected face crop. This is not
state-of-the-art face recognition (it can't match across pose / lighting like
ArcFace or FaceNet) but it produces meaningful, repeatable embeddings for a
demo or pilot deployment.

To upgrade to a real deep model, write a new backend that implements the
FaceBackend protocol and selects from `face_backend=deepface` (etc).

This module imports cv2 lazily so the service still starts when opencv isn't
installed. If you select `face_backend=opencv` without installing the
optional dependency, factory.py falls back to the stub backend with a warning.
"""

from __future__ import annotations

import base64
import logging
from io import BytesIO

import numpy as np

from .base import Embedding, FaceBackend

log = logging.getLogger(__name__)

# Hint to readers: histogram regions × bins per region = embedding dimension.
_GRID = 4  # 4×4 = 16 regions
_BINS = 8  # → 16 * 8 = 128 dim by default


class OpenCVFaceBackend(FaceBackend):
    name = "opencv"

    def __init__(self, embedding_dim: int = 128) -> None:
        import cv2  # imported here so the module loads even without cv2
        self._cv2 = cv2
        self._detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        if self._detector.empty():
            raise RuntimeError("Failed to load Haar cascade from OpenCV data dir")
        # Derive grid/bins from requested dim, falling back to defaults.
        # Keep total = grid² * bins = embedding_dim.
        self._grid, self._bins = self._fit_dims(embedding_dim)
        self._dim = self._grid * self._grid * self._bins

    @staticmethod
    def _fit_dims(target: int) -> tuple[int, int]:
        # Pick the largest grid such that grid² divides cleanly into `target`.
        for grid in (8, 6, 4, 3, 2):
            if target % (grid * grid) == 0:
                return grid, target // (grid * grid)
        # Fallback to the canonical 4×4 × 8 = 128.
        return _GRID, _BINS

    @property
    def dim(self) -> int:
        return self._dim

    def embed(self, image_b64: str) -> Embedding:
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        try:
            raw = base64.b64decode(image_b64, validate=False)
        except Exception:
            log.warning("Could not base64-decode image; returning empty embedding")
            return Embedding(np.zeros(self._dim, dtype=np.float32), False, 0.0, self.name)

        # Decode image via OpenCV.
        cv2 = self._cv2
        arr = np.frombuffer(raw, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            log.warning("OpenCV could not decode image bytes")
            return Embedding(np.zeros(self._dim, dtype=np.float32), False, 0.0, self.name)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        faces = self._detector.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(40, 40))
        if len(faces) == 0:
            return Embedding(np.zeros(self._dim, dtype=np.float32), False, 0.0, self.name)

        # Pick the largest detected face.
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        face = gray[y : y + h, x : x + w]

        # Resize to a canonical 128×128 patch so the grid maths is stable.
        face = cv2.resize(face, (128, 128), interpolation=cv2.INTER_AREA)

        # Compute per-cell histogram features.
        cell = 128 // self._grid
        features = []
        for gy in range(self._grid):
            for gx in range(self._grid):
                patch = face[gy * cell : (gy + 1) * cell, gx * cell : (gx + 1) * cell]
                hist, _ = np.histogram(patch, bins=self._bins, range=(0, 256))
                features.append(hist.astype(np.float32))
        vec = np.concatenate(features)

        # L2 normalise so cosine distance works consistently.
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        # Quality: combine relative face area with histogram entropy
        # (very uniform crop = mostly featureless background).
        face_area = (w * h) / (img.shape[0] * img.shape[1])
        entropy = float(-(vec * np.log(np.maximum(vec, 1e-6))).sum())
        quality = float(np.clip(0.3 + face_area * 1.5 + entropy / 12, 0.0, 1.0))
        return Embedding(vector=vec, face_detected=True, quality=quality, backend=self.name)
