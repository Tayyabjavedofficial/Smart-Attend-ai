# AttendAI · Smart Attendance Management System

End-to-end deployment of the AI-Based Smart Attendance Management System. Three services + a database orchestrated into one stack with Docker Compose.

```
                            ┌──────────────┐
                            │   Browser    │
                            └──────┬───────┘
                                   │ http
                  ┌────────────────┼────────────────┐
                  │                │                │
            ┌─────▼──────┐   ┌─────▼──────┐  ┌──────▼─────┐
            │  frontend  │   │   backend  │  │ swagger /  │
            │ (Next.js)  │   │ (Spring +  │  │  docs UI   │
            │  :3000     │   │   STOMP)   │  │  :8000/docs│
            └────────────┘   │  :8080     │  └─────▲──────┘
                             │            │        │
                             │            │   X-Service-Key
                             │            │ ──────►│
                             └─┬────────┬─┘  ┌─────┴──────┐
                               │        │    │     ai     │
                          jdbc │        └───►│ (FastAPI)  │
                               ▼             │  :8000     │
                        ┌────────────┐       └────────────┘
                        │   mysql    │
                        │   8.4      │
                        └────────────┘
```

## Quickstart

```bash
cp .env.example .env          # optional - sensible defaults work for dev
docker compose up -d          # build all four images + start
docker compose logs -f        # watch the boot

open http://localhost:3000
```

### Default credentials

The backend seeds an admin user on first boot (via Flyway V2):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@attendai.local` | `Admin@12345` |

Teacher and student accounts must be created from the Admin dashboard.

### Ports

| Service | URL | Purpose |
|---|---|---|
| Frontend | http://localhost:3000 | The user-facing dashboards |
| Backend | http://localhost:8080/swagger-ui.html | REST API + interactive docs |
| AI service | http://localhost:8000/docs | Face / risk endpoints (service-key protected) |
| MySQL | localhost:3306 | Database (exposed for SQL clients during dev) |

## Production checklist

Before pointing real users at this:

1. **Rotate `JWT_SECRET`** — the default is publicly known. Use at least 32 random chars (`openssl rand -hex 32`).
2. **Rotate `AI_SERVICE_KEY`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`**.
3. **Set `BACKEND_PUBLIC_URL`** to the real backend URL the browser will see (not `localhost`).
4. **Set `CORS_ORIGINS`** to the real frontend URL (passed via `FRONTEND_PUBLIC_URL`).
5. Put a real TLS terminator (Caddy, nginx, Cloudflare) in front. The compose file binds plain HTTP.
6. Comment out the MySQL `ports:` section so the DB isn't exposed to the world.
7. Consider switching `AI_FACE_BACKEND=opencv` (uncomment the apt step in `attendai-ai-service/Dockerfile`) or plugging in a deep-learning backend.
8. Back up the `mysql_data` and `ai_embeddings` named volumes regularly.

## Wiring deep-dive

### The `AI_USE_STUB` switch

The backend ships with two `FaceVerifier` implementations selected by `@ConditionalOnProperty`:

- `AI_USE_STUB=true` → `StubFaceVerifier` is registered. The Java side returns deterministic high-confidence VERIFIED results without ever touching the network. **The AI service container can be turned off entirely** and the attendance flow still works.
- `AI_USE_STUB=false` (compose default) → `RemoteFaceVerifier` is registered. Every `verify()` call forwards to the AI service over HTTP with the shared `X-Service-Key`. If the AI service goes down, `RemoteFaceVerifier` returns `MANUAL_REVIEW_REQUIRED` instead of crashing the pipeline (SRS §6.4 NFR-REL-03).

### NEXT_PUBLIC_API_BASE is a *build-time* arg

Next.js bakes `NEXT_PUBLIC_*` env vars into the JS bundle when `next build` runs. That means the frontend's view of "where the backend is" is fixed when the image is built, not when the container starts.

The compose file handles this with build args:

```yaml
frontend:
  build:
    args:
      NEXT_PUBLIC_API_BASE: ${BACKEND_PUBLIC_URL:-http://localhost:8080}
```

If you change `BACKEND_PUBLIC_URL`, you must rebuild the frontend image:

```bash
docker compose build frontend
docker compose up -d frontend
```

### Database migrations

Flyway runs `db/migration/V1__init_schema.sql` and `V2__seed_default_admin.sql` automatically on first boot. You won't see "table not found" errors — the backend won't open the HTTP listener until migrations complete.

To add a new migration:

1. Drop a `V3__your_change.sql` into `attendai-backend/src/main/resources/db/migration/`
2. Rebuild the backend image: `docker compose build backend && docker compose up -d backend`
3. Flyway picks it up on the next boot

### WebSocket / STOMP

The backend exposes `/ws` for STOMP-over-WebSocket. The frontend's teacher dashboard subscribes to:

- `/topic/session/{id}/events` — per-attendance and lifecycle events
- `/topic/session/{id}/live` — `LiveCounters {present, absent, late, suspicious, pendingReview, total}`

Both are broadcast by `SessionEventPublisher` whenever a student marks attendance or a challenge / session changes state.

## Common operations

```bash
# Watch backend logs
docker compose logs -f backend

# Run the AI service's tests
docker compose run --rm ai pytest -q

# Open a MySQL shell
docker compose exec mysql mysql -u root -prootpass attendai

# Restart just the backend (e.g. after editing application.yml)
docker compose restart backend

# Clean rebuild (cache busted)
make rebuild

# Destroy everything including volumes
make reset
```

## Project structure

```
attendai-stack/
├── docker-compose.yml          # this stack
├── .env.example
├── Makefile                    # convenience wrappers
├── README.md                   # you are here
│
├── attendai-backend/           # Spring Boot 3.3 · Java 17 · MySQL · STOMP
│   ├── Dockerfile
│   ├── pom.xml
│   ├── src/...
│   └── README.md               # backend-specific details
│
├── attendai-frontend/          # Next.js 14 · TypeScript · Tailwind · TanStack Query
│   ├── Dockerfile
│   ├── package.json
│   ├── src/...
│   └── README.md
│
└── attendai-ai-service/        # Python 3.12 · FastAPI · numpy · pluggable face backends
    ├── Dockerfile
    ├── requirements.txt
    ├── app/...
    └── README.md
```

Each project has its own README with internals worth reading.
