"""Schemas for /ai/proxy/risk-score.

Mirrors the rule-based RiskScorer on the Spring Boot side, so the AI service
can either replicate that logic (default) or offer an ML model variant that
returns a richer payload.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskScoreRequest(BaseModel):
    wrong_code_attempts: int = Field(0, ge=0)
    device_trusted: bool = True
    device_used_by_multiple_accounts: bool = False
    face_failed: bool = False
    face_confidence: float = Field(1.0, ge=0.0, le=1.0)
    late_by_seconds: int = Field(0, ge=0)
    duplicate_attempt: bool = False
    missed_random_challenges: int = Field(0, ge=0)
    suspicious_ip_pattern: bool = False


class RiskScoreResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    level: RiskLevel
    factors: list[str] = Field(default_factory=list)
    model: str = "rule_based_v1"
