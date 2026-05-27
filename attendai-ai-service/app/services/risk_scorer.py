"""Risk scoring.

This service exists so the AI side can offer either:
  1. The same deterministic rule-based scorer the Java backend uses (default),
     letting both sides agree on borderline cases.
  2. A swap-in ML scorer trained on flagged attendance attempts (Phase 5+).

We start with #1 - identical to RiskScorer.java on the Spring Boot side - and
return a `model` field so callers can tell which version produced the score.
"""

from __future__ import annotations

from typing import List

from ..schemas.risk import RiskLevel, RiskScoreRequest, RiskScoreResponse


# Thresholds match RiskScorer.java -> AppProperties.RiskThresholds.
_LOW = 30
_MEDIUM = 60
_HIGH = 80


def _level_for(score: int) -> RiskLevel:
    if score <= _LOW:
        return RiskLevel.LOW
    if score <= _MEDIUM:
        return RiskLevel.MEDIUM
    if score <= _HIGH:
        return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def score(req: RiskScoreRequest) -> RiskScoreResponse:
    """Compute a 0..100 risk score from per-attempt signals."""
    s = 0
    factors: List[str] = []

    if req.wrong_code_attempts > 0:
        add = min(30, req.wrong_code_attempts * 10)
        s += add
        factors.append(f"wrong_code_attempts:{req.wrong_code_attempts}")

    if not req.device_trusted:
        s += 20
        factors.append("untrusted_device")

    if req.device_used_by_multiple_accounts:
        s += 30
        factors.append("multi_account_device")

    if req.face_failed:
        s += 40
        factors.append("face_failed")
    elif req.face_confidence < 0.75:
        slope = (0.75 - req.face_confidence) / 0.25
        add = int(min(25.0, slope * 25.0))
        if add > 0:
            s += add
            factors.append(f"low_face_confidence:{req.face_confidence:.2f}")

    if req.late_by_seconds > 0:
        s += 50
        factors.append(f"late_by_seconds:{req.late_by_seconds}")

    if req.duplicate_attempt:
        s += 50
        factors.append("duplicate_attempt")

    if req.missed_random_challenges > 0:
        s += min(20, req.missed_random_challenges * 5)
        factors.append(f"missed_random_challenges:{req.missed_random_challenges}")

    if req.suspicious_ip_pattern:
        s += 20
        factors.append("suspicious_ip")

    s = min(100, s)
    return RiskScoreResponse(score=s, level=_level_for(s), factors=factors)
