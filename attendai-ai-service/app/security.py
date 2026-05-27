"""Service-to-service auth.

The Spring Boot backend includes the service key in the X-Service-Key header on
every call. This is intentionally simple - we're not protecting end users here,
we're stopping random clients from hitting the AI service if it's exposed.
"""

from fastapi import Header, HTTPException, status

from .config import settings


async def require_service_key(
    x_service_key: str | None = Header(default=None, alias="X-Service-Key"),
) -> None:
    if not x_service_key or x_service_key != settings.service_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AI_AUTH", "message": "Invalid or missing X-Service-Key"},
        )
