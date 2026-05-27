"""POST /ai/face/register, /ai/face/verify, GET /ai/face/{id}, DELETE /ai/face/{id}.

All endpoints under this router require the X-Service-Key header (enforced at
the router level via dependencies).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ..deps import get_face_service, get_store
from ..schemas.face import (
    DeleteResponse,
    ProfileStatusResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyRequest,
    VerifyResponse,
)
from ..security import require_service_key
from ..services.embedding_store import EmbeddingStore
from ..services.face_service import FaceService

log = logging.getLogger(__name__)

router = APIRouter(
    prefix="/ai/face",
    tags=["face"],
    dependencies=[Depends(require_service_key)],
)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, svc: FaceService = Depends(get_face_service)) -> RegisterResponse:
    try:
        profile = svc.register(req.student_id, req.images, req.metadata)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "AI_002", "message": str(e)},
        ) from e

    return RegisterResponse(
        profile_id=profile.profile_id,
        student_id=profile.student_id,
        samples_used=profile.samples_count,
        samples_rejected=int(profile.metadata.get("samples_rejected", 0)),
        embedding_dim=svc.backend.dim,
        quality_score=profile.quality_score,
        backend=profile.backend,
        created_at=profile.created_at,
    )


@router.post("/verify", response_model=VerifyResponse)
def verify(req: VerifyRequest, svc: FaceService = Depends(get_face_service)) -> VerifyResponse:
    outcome = svc.verify(req.student_id, req.image)
    return VerifyResponse(
        verified=outcome.verified,
        confidence=outcome.confidence,
        status=outcome.status,
        embedding_distance=outcome.distance,
        threshold=outcome.metadata.get("threshold", 0.0),
        metadata=outcome.metadata,
    )


@router.get("/{student_id}", response_model=ProfileStatusResponse)
def status_for(student_id: int, store: EmbeddingStore = Depends(get_store)) -> ProfileStatusResponse:
    profile = store.load(student_id)
    if profile is None:
        return ProfileStatusResponse(student_id=student_id, has_profile=False)
    return ProfileStatusResponse(
        student_id=student_id,
        has_profile=True,
        samples_count=profile.samples_count,
        backend=profile.backend,
        created_at=profile.created_at,
    )


@router.delete("/{student_id}", response_model=DeleteResponse)
def delete(student_id: int, svc: FaceService = Depends(get_face_service)) -> DeleteResponse:
    return DeleteResponse(student_id=student_id, deleted=svc.delete(student_id))
