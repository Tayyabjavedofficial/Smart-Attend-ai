"""POST /ai/proxy/risk-score.

Wraps services.risk_scorer.score; protected by X-Service-Key.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..schemas.risk import RiskScoreRequest, RiskScoreResponse
from ..security import require_service_key
from ..services import risk_scorer

router = APIRouter(
    prefix="/ai/proxy",
    tags=["risk"],
    dependencies=[Depends(require_service_key)],
)


@router.post("/risk-score", response_model=RiskScoreResponse)
def risk_score(req: RiskScoreRequest) -> RiskScoreResponse:
    return risk_scorer.score(req)
