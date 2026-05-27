"""FastAPI entrypoint.

Wires the routers, CORS, and a uniform JSON error envelope that the Spring
Boot AiServiceClient understands. Service auth is applied at the router level
(everything except /health requires the X-Service-Key header).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .deps import get_face_backend, get_store
from .routers import face, health, risk

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-build the backend + store so the first request doesn't pay the cost.
    log.info("Booting %s v%s", settings.service_name, settings.version)
    backend = get_face_backend()
    store = get_store()
    log.info(
        "Ready: backend=%s dim=%d profiles=%d storage=%s",
        backend.name, backend.dim, store.count(), settings.storage_dir,
    )
    yield
    log.info("Shutting down")


app = FastAPI(
    title="AttendAI · AI Service",
    description=(
        "Face registration, face verification, and proxy risk scoring for the "
        "AttendAI Smart Attendance System. Designed to sit behind the Spring "
        "Boot backend - clients should not call this service directly."
    ),
    version=settings.version,
    lifespan=lifespan,
)

# CORS - locked-down list in production.
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(face.router)
app.include_router(risk.router)


# ---- Uniform error envelope (matches the Spring Boot ApiResponse shape) ----

def _envelope(success: bool, code: str | None, message: str | None, status_code: int) -> JSONResponse:
    payload: dict = {"success": success}
    if not success:
        payload["error"] = {"code": code or "AI_INTERNAL", "message": message or "Internal error"}
    return JSONResponse(status_code=status_code, content=payload)


@app.exception_handler(StarletteHTTPException)
async def http_exc(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict):
        return _envelope(False, exc.detail.get("code"), exc.detail.get("message"), exc.status_code)
    return _envelope(False, "AI_HTTP", str(exc.detail), exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exc(_: Request, exc: RequestValidationError) -> JSONResponse:
    return _envelope(False, "AI_VALIDATION", str(exc.errors()), 422)


@app.exception_handler(Exception)
async def unhandled_exc(_: Request, exc: Exception) -> JSONResponse:
    log.exception("Unhandled error")
    return _envelope(False, "AI_INTERNAL", str(exc), 500)
