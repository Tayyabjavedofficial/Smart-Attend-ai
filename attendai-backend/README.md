---
title: AttendAI Backend
emoji: 🎓
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 8080
pinned: false
---

# AttendAI Backend

Spring Boot 3 + Java 17 REST API for the AI-Based Smart Attendance Management System.

## Stack

- **Java 17**, **Spring Boot 3.3.5**
- **Spring Security 6** with stateless JWT (HS256, access + rotating refresh)
- **Spring Data JPA** + Hibernate
- **MySQL 8** (PostgreSQL also supported) with **Flyway** migrations
- **H2** in-memory DB for tests
- **WebFlux** WebClient for calls to the Python AI service
- **springdoc-openapi** for Swagger UI at `/swagger-ui.html`
- **Lombok** + **MapStruct**

## Project layout

```
src/main/java/com/attendai/
├── AttendaiApplication.java
├── config/              # Security, JWT filter, AppProperties, UserPrincipal
├── common/              # ApiResponse, exceptions, audit, utilities
├── domain/
│   ├── user/            # User, Student, Teacher, Admin + repos
│   ├── course/          # Course, Section, StudentCourse, TeacherCourse
│   ├── attendance/      # AttendanceSession, Challenge, Record, Attempt + enums
│   └── security/        # FaceProfile, TrustedDevice, ProxyAlert, RefreshToken
├── auth/                # AuthController, AuthService, JwtService, DTOs
├── modules/
│   ├── admin/           # Admin CRUD endpoints (reference impl: student CRUD)
│   ├── teacher/         # Teacher endpoints (session lifecycle stubs)
│   └── student/         # Student endpoints (attendance flow stubs)
└── ai/                  # AiServiceClient for the Python microservice
```

## Quickstart

### 1. Start MySQL

```bash
docker compose up -d mysql
```

Wait until `docker compose ps` shows `healthy`. (Optional phpMyAdmin at http://localhost:8081)

### 2. Run the backend

```bash
mvn spring-boot:run
```

(Or `./mvnw spring-boot:run` if you generate the Maven Wrapper with `mvn wrapper:wrapper` first.)

The app starts on **http://localhost:8080**. Flyway runs the schema migration and seeds the default admin on first start.

### 3. Log in

Default admin:

- Email: `admin@attendai.local`
- Password: `Admin@12345`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@attendai.local","password":"Admin@12345"}'
```

### 4. Swagger UI

http://localhost:8080/swagger-ui.html

## Configuration

All runtime config is exposed under the `app.*` prefix in `application.yml`. Env vars override:

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | dev secret | HS256 signing key — set in production |
| `DB_USER` / `DB_PASSWORD` | `attendai` / `attendai` | MySQL credentials |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Frontend origins |
| `AI_SERVICE_URL` | `http://localhost:8000` | Python FastAPI base URL |
| `AI_SERVICE_KEY` | `dev-service-key` | Service-to-service auth |

## Tests

```bash
mvn test
```

`AttendaiApplicationTests` boots the full context against H2 — catches most wiring regressions.

## Implementation status

| Item | Status |
|---|---|
| Project scaffold (Maven, profiles, security, Swagger) | **Done** (P2) |
| Auth: login / refresh / logout with JWT rotation | **Done** (P2) |
| Roles + method security (`@PreAuthorize`) | **Done** (P2) |
| All 14 entities + repositories | **Done** (P2) |
| Flyway V1 schema + V2 seed admin | **Done** (P2) |
| Admin: students / teachers / courses / sections / enrollments CRUD | **Done** (P2) |
| Admin: teacher-course assignment | **Done** (P2) |
| Admin: proxy alerts + trusted devices + dashboard counters | **Done** (P2) |
| Teacher: list assigned courses + own sessions | **Done** (P2) |
| Student: enrolled courses, history, percentage, device register | **Done** (P2) |
| **Teacher: session lifecycle (create / start / challenge / close / live)** | **Done** (P4) |
| **Challenge generation (code + QR, expiry, auto-rotate)** | **Done** (P4) |
| **Student: attendance marking pipeline (12-step validation)** | **Done** (P4) |
| **Face verification interface + stub** (real impl in P5) | **Done** (P4) |
| **Risk scoring (rule-based, factor-tracked)** | **Done** (P4) |
| **WebSocket STOMP broker + per-session topics** | **Done** (P4) |
| **Live counters + event broadcasts to teacher UIs** | **Done** (P4) |
| **Auto-expire scheduled job** | **Done** (P4) |
| Pipeline unit tests (Mockito) | **Done** (P4) |
| **Student: face register / verify endpoints** | **Done** (P5) — calls Python AI service |
| **`RemoteFaceVerifier`** (activates when `app.ai.use-stub=false`) | **Done** (P5) |
| **Reports: PDF / Excel / CSV exporters** | **Done** (P6) |
| **Reports: student / course / defaulters / proxy-alerts / date-range** | **Done** (P6) |

## What's next

All core SRS deliverables complete. Optional follow-ups:
- Wire frontend mock data to live API calls (TanStack Query + STOMP)
- Testcontainers-based integration tests across MySQL + AI service
- Top-level docker-compose for one-command deployment

## Plugging in the Phase 5 AI service

The Python FastAPI service lives in a sibling repo (`attendai-ai-service`).

```yaml
# application.yml on the backend
app:
  ai:
    base-url: http://localhost:8000
    service-key: dev-service-key   # must match ATTENDAI_AI_SERVICE_KEY on the Python side
    use-stub: false                # disables StubFaceVerifier, activates RemoteFaceVerifier
```

When `use-stub=false`, Spring's `@ConditionalOnProperty` swaps `StubFaceVerifier` out and wires `RemoteFaceVerifier`, which delegates `verify()` calls to the AI service via `AiServiceClient`. The marking pipeline doesn't change — it sees the same `FaceVerifier` interface either way. If the AI service is unreachable, `RemoteFaceVerifier` returns `MANUAL_REVIEW_REQUIRED` instead of crashing (SRS § 6.4 NFR-REL-03).

## Reports (Phase 6)

Every report is exposed twice: JSON for in-app preview, and a file download for offline use.

| JSON endpoint | File endpoint | Roles |
|---|---|---|
| `GET /api/reports/student/{id}` | `GET /api/reports/student/{id}/export?format=pdf\|xlsx\|csv` | ADMIN, TEACHER, STUDENT (self only) |
| `GET /api/reports/course/{id}` | `GET /api/reports/course/{id}/export?format=...` | ADMIN, TEACHER |
| `GET /api/reports/defaulters` | `GET /api/reports/defaulters/export?format=...` | ADMIN, TEACHER |
| `GET /api/reports/proxy-alerts` | `GET /api/reports/proxy-alerts/export?format=...` | ADMIN, TEACHER |
| `GET /api/reports/range?from=...&to=...` | `GET /api/reports/range/export?format=...` | ADMIN, TEACHER |

All reports share a single canonical `ReportData` shape so the three exporters (`CsvExporter`, `XlsxExporter`, `PdfExporter`) never need to know about specific report types. To add a new report type, write a method on `ReportService` that produces a `ReportData` and add two endpoints. The exporters take care of the rest.

**Libraries:**
- **OpenPDF** (LGPL) for PDF — typed `PdfPTable`, brand colours match the frontend palette
- **Apache POI** (Apache 2) for XLSX — typed cells so spreadsheet formulas work on numbers and dates
- Hand-rolled UTF-8 BOM CSV (RFC 4180) — no extra dep

## Conventions

- **Entities** never leave the service layer — controllers return DTOs.
- **Errors** flow through `ApiException` and `GlobalExceptionHandler`.
- **All endpoints** return the `ApiResponse<T>` envelope (see API design § 1.4).
- **Method security** is preferred over URL-pattern security — `@PreAuthorize("hasRole('TEACHER')")` on every controller method.

## WebSocket (Phase 4)

Clients connect to `/ws` (SockJS-compatible STOMP). Subscribe per session:

| Topic | Payload | Sent when |
|---|---|---|
| `/topic/session/{id}/events` | `SessionEvent` (sealed: `ATTENDANCE_MARKED` / `CHALLENGE_STARTED` / `CHALLENGE_EXPIRED` / `SESSION_STARTED` / `SESSION_CLOSED`) | A student marks attendance or the session/challenge state changes |
| `/topic/session/{id}/live` | `LiveCounters` `{present, absent, late, suspicious, pendingReview, total}` | After every successful mark, plus when the teacher's UI calls `GET /api/teacher/attendance-sessions/{id}/live` |

Frontend example with `@stomp/stompjs`:

```js
const client = new Client({ brokerURL: "ws://localhost:8080/ws" });
client.onConnect = () => {
  client.subscribe(`/topic/session/${sessionId}/events`, msg => {
    const ev = JSON.parse(msg.body);
    if (ev.type === "ATTENDANCE_MARKED") updateRoster(ev);
  });
  client.subscribe(`/topic/session/${sessionId}/live`, msg => {
    setCounters(JSON.parse(msg.body));
  });
};
client.activate();
```

## Toggling the AI service stub

`app.ai.use-stub=true` (the default) registers `StubFaceVerifier`, which returns high-confidence verified results so the pipeline runs end-to-end without the Python service. Once Phase 5's FastAPI service is up, set `AI_USE_STUB=false` and the real `RemoteFaceVerifier` takes over.
- **Migrations are forward-only**. Once V*N* has shipped to any environment, never edit it; add V*N+1* instead.
