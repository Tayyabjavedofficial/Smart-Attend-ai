"""Pydantic models for /ai/face/* endpoints.

These deliberately mirror the field names used by the Spring Boot
AiServiceClient so the on-the-wire JSON is identical regardless of which side
you're looking at.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, ConfigDict


class VerifyStatus(str, Enum):
    VERIFIED = "VERIFIED"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    FAILED = "FAILED"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"


# ---------- Register ----------

class RegisterRequest(BaseModel):
    """Register or replace a student's face profile.

    Multiple sample images can be provided; the server averages their
    embeddings for a more robust profile.
    """

    student_id: int = Field(..., gt=0, description="Internal student ID from the backend")
    images: list[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Base64-encoded face images (raw bytes, optionally data: prefixed).",
    )
    metadata: dict[str, Any] | None = None


class RegisterResponse(BaseModel):
    profile_id: str
    student_id: int
    samples_used: int
    samples_rejected: int
    embedding_dim: int
    quality_score: float = Field(..., ge=0.0, le=1.0)
    backend: str
    created_at: datetime


# ---------- Verify ----------

class VerifyContext(BaseModel):
    """Optional context to help debugging / auditing the verification."""
    session_id: int | None = None
    challenge_id: int | None = None


class VerifyRequest(BaseModel):
    student_id: int = Field(..., gt=0)
    image: str = Field(..., min_length=8, description="Base64-encoded face image")
    context: VerifyContext | None = None


class VerifyResponse(BaseModel):
    verified: bool
    confidence: float = Field(..., ge=0.0, le=1.0)
    status: VerifyStatus
    embedding_distance: float | None = None
    threshold: float
    metadata: dict[str, Any] = Field(default_factory=dict)


# ---------- Delete / status ----------

class ProfileStatusResponse(BaseModel):
    student_id: int
    has_profile: bool
    samples_count: int | None = None
    backend: str | None = None
    created_at: datetime | None = None


class DeleteResponse(BaseModel):
    student_id: int
    deleted: bool


# Allow the response models to serialize numpy / pathlib types if they ever
# leak through.
for _cls in (RegisterResponse, VerifyResponse, ProfileStatusResponse, DeleteResponse):
    _cls.model_config = ConfigDict(arbitrary_types_allowed=True)
