# AttendAI · AI Service

FastAPI microservice that owns face registration, face verification, and proxy risk scoring for the AttendAI Smart Attendance System. The Spring Boot backend calls this service over HTTP behind a shared service key.

## Why a separate service?

- **Independent deployment** — heavy ML deps don't bloat the Java backend image
- **Language fit** — Python's ML ecosystem is where the face-recognition libraries live
- **Pluggable model** — the backend treats this as a black box behind `FaceVerifier`, so swapping the model is a config change, not a code change
- **Scaling** — face verification is CPU-bound and can be horizontally scaled separately from the transactional backend

## Architecture

```
        Spring Boot backend
                │
        X-Service-Key header
                ▼
    ┌────────────────────────┐
    │   FastAPI AI Service   │
    │                        │
    │  /ai/face/register     │
    │  /ai/face/verify       │      ┌────────────────┐
    │  /ai/face/{id}         │ ───► │  FaceBackend   │ (stub | opencv | ...)
    │  /ai/proxy/risk-score  │      └────────────────┘
    │  /health               │              │
    └────────────────────────┘      ┌───────▼────────┐
                                    │ EmbeddingStore │ (file-based, swappable)
                                    └────────────────┘
```

## Quickstart

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload
# Open http://localhost:8000/docs for Swagger
```

Verify it's up:

```bash
curl http://localhost:8000/health
```

## API

All endpoints under `/ai/*` require `X-Service-Key: <key>`. `/health` is public.

### `POST /ai/face/register`

```json
{
  "student_id": 101,
  "images": ["base64...", "base64...", "base64..."],
  "metadata": {"source": "registration_flow"}
}
```

→ `201 Created`

```json
{
  "profile_id": "fp_a3b2c1...",
  "student_id": 101,
  "samples_used": 3,
  "samples_rejected": 0,
  "embedding_dim": 128,
  "quality_score": 0.87,
  "backend": "stub",
  "created_at": "2025-05-26T..."
}
```

### `POST /ai/face/verify`

```json
{
  "student_id": 101,
  "image": "base64...",
  "context": { "session_id": 301, "challenge_id": 901 }
}
```

→ `200 OK`

```json
{
  "verified": true,
  "confidence": 0.94,
  "status": "VERIFIED",
  "embedding_distance": 0.18,
  "threshold": 0.55,
  "metadata": { "backend": "stub", "face_quality": 0.82 }
}
```

`status` ∈ `VERIFIED` | `LOW_CONFIDENCE` | `FAILED` | `MANUAL_REVIEW_REQUIRED`.

### `POST /ai/proxy/risk-score`

Mirrors the rule-based logic in `RiskScorer.java` so both sides agree on borderline cases.

```json
{
  "wrong_code_attempts": 0,
  "device_trusted": true,
  "device_used_by_multiple_accounts": false,
  "face_failed": false,
  "face_confidence": 0.94,
  "late_by_seconds": 0,
  "duplicate_attempt": false,
  "missed_random_challenges": 0,
  "suspicious_ip_pattern": false
}
```

→ `200 OK`

```json
{
  "score": 8,
  "level": "LOW",
  "factors": [],
  "model": "rule_based_v1"
}
```

### `GET /ai/face/{student_id}` — profile status (does the student have a profile?)

### `DELETE /ai/face/{student_id}` — remove a profile (used by the admin reset flow)

### `GET /health` — liveness + service info (no auth)

## Face backends

Selected via `ATTENDAI_AI_FACE_BACKEND`. Falls back to `stub` if the requested backend's optional dependencies aren't installed.

| Backend | Dependencies | What it does |
|---|---|---|
| `stub` *(default)* | numpy only | Deterministic hash-based pseudo-embedding. Same input → same embedding (so enrollment verifies), different inputs → different embeddings (so impostors fail). Useful for dev, CI, and end-to-end testing without an ML stack. |
| `opencv` | `opencv-python-headless` | Real face detection via Haar cascade + histogram-based embedding. Lightweight (~50MB extra), no model download. Not state-of-the-art but works on commodity hardware. |

### Adding a new backend

1. Subclass `app.backends.base.FaceBackend`
2. Implement `embed(image_b64: str) -> Embedding`
3. Register it in `app/backends/__init__.py:build_face_backend()`
4. Set `ATTENDAI_AI_FACE_BACKEND=yourname`

A `deepface` or `insightface` backend would be ~50 lines.

## Wiring it to the Spring Boot backend

In the backend's `application.yml`:

```yaml
app:
  ai:
    base-url: http://localhost:8000
    service-key: dev-service-key   # match ATTENDAI_AI_SERVICE_KEY here
    use-stub: false                # this enables the real RemoteFaceVerifier
```

The backend's `AiServiceClient` (Java side) is the typed counterpart of this service. Phase 4's `StubFaceVerifier` is automatically deactivated when `use-stub: false`.

## Tests

```bash
pytest -v
```

14 tests cover: auth, registration (single + multi-sample), verification (match / no-match / unknown student), profile status, deletion, risk scoring (parity with the Java `RiskScorer` thresholds).

## Docker

```bash
docker build -t attendai-ai .
docker run -p 8000:8000 \
  -e ATTENDAI_AI_SERVICE_KEY=dev-service-key \
  -v $(pwd)/storage/embeddings:/app/storage/embeddings \
  attendai-ai

# or with compose
docker compose up -d
```

The default image is slim (~150 MB). If you switch to the OpenCV backend, uncomment the apt step in the Dockerfile to install `libgl1` and `libglib2`.

## Project layout

```
attendai-ai-service/
├── app/
│   ├── main.py                  # FastAPI app, error envelope, lifespan
│   ├── config.py                # env-driven settings
│   ├── security.py              # X-Service-Key dependency
│   ├── deps.py                  # cached singletons
│   ├── schemas/
│   │   ├── face.py              # register / verify / status / delete
│   │   └── risk.py              # risk score I/O
│   ├── routers/
│   │   ├── health.py
│   │   ├── face.py
│   │   └── risk.py
│   ├── services/
│   │   ├── face_service.py      # register / verify / delete orchestration
│   │   ├── embedding_store.py   # file-based profile persistence
│   │   └── risk_scorer.py       # rule-based scorer (parity with Java)
│   └── backends/
│       ├── base.py              # FaceBackend Protocol
│       ├── stub.py              # deterministic, no ML deps
│       ├── opencv.py            # real face detection (optional)
│       └── __init__.py          # factory with graceful fallback
├── tests/
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_face.py
│   └── test_risk.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
