# AttendAI Frontend

Next.js 14 + TypeScript + Tailwind CSS dashboards for the AI-Based Smart Attendance Management System.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** with a custom institutional theme
- **Lucide React** outline icons
- **Recharts** for donut + trend charts
- **Zustand** for auth state (persisted to localStorage)
- **Custom font pairing**: Instrument Serif (display) + Geist (body) + JetBrains Mono — no Inter, no Roboto, nothing generic

## Design direction

This is not a generic Tailwind-purple SaaS template. The whole UI commits to one aesthetic:

- **Warm off-white canvas** with subtle radial gradients and a faint paper-grain overlay — the background does work
- **Frosted glass cards** floating on top via `backdrop-blur` and a soft inner highlight
- **Deep teal sidebar** (a single, large rounded-3xl panel detached from the edges) — your reference image, refined
- **Editorial serif headings** (Instrument Serif) paired with technical sans body type — this is the differentiator
- **A custom logo**: a stylized "A" whose crossbar is a checkmark — embeds the attendance concept into the wordmark

## Quickstart

```bash
npm install
npm run dev
# open http://localhost:3000
```

The app starts in **mock mode** (`NEXT_PUBLIC_MOCK=true` in `.env.local`) so you can explore all three dashboards without a backend running.

### Demo credentials (mock mode)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@attendai.local` | `Admin@12345` |
| Teacher | `sarah.johnson@inst.edu` | `Teacher@123` |
| Student | `aarav.sharma@inst.edu` | `Student@123` |

The login screen shows clickable chips to auto-fill these.

### Connecting to the backend

1. Start the Spring Boot backend (see `attendai-backend/README.md`).
2. Edit `.env.local`:
   ```
   NEXT_PUBLIC_MOCK=false
   NEXT_PUBLIC_API_BASE=http://localhost:8080
   ```
3. Restart `npm run dev`.

The Next.js config proxies `/api/backend/*` to the backend, sidestepping CORS during development.

## Live backend wiring

The app starts in **mock mode** by default (`NEXT_PUBLIC_MOCK=true` in `.env.local`). Flip to `false` and the same hooks fetch from the Spring Boot backend at `NEXT_PUBLIC_API_BASE`.

```bash
# .env.local
NEXT_PUBLIC_MOCK=false
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

**Architecture:**

```
┌────────────────────┐     useQuery / useMutation     ┌──────────┐
│  Pages             │ ─────────────────────────────▶ │  hooks.ts │
└────────────────────┘                                  └─────┬────┘
                                                              │
                                                              ▼
                                                       ┌──────────┐
                              REST + 401 refresh       │  api.ts   │ ──▶  /api/backend/* (proxied to Spring Boot)
                                                       └──────────┘
                                                              │
                                                              └──▶ mock fallback (when NEXT_PUBLIC_MOCK=true)

┌────────────────────┐     useSessionLiveStream       ┌──────────┐
│  Teacher dashboard │ ─────────────────────────────▶ │ stomp.ts  │ ──▶  ws://…/ws (STOMP over WebSocket)
└────────────────────┘                                  └──────────┘
```

**`src/lib/api.ts`** — typed client. One namespace per role (`api.admin.*`, `api.teacher.*`, `api.student.*`, `api.reports.*`). The `request()` wrapper attaches the JWT, parses the `ApiResponse` envelope, and on 401 transparently tries the refresh endpoint once before giving up and emitting a global `attendai:logout` event.

**`src/lib/hooks.ts`** — `useQuery` / `useMutation` wrappers with a centralised query-key tree (`qk.admin.students`, etc). Mutations invalidate the relevant queries automatically.

**`src/lib/stomp.ts`** — `useSessionLiveStream(sessionId)` connects to `/ws`, subscribes to `/topic/session/{id}/events` and `/topic/session/{id}/live`, and returns `{ counters, events, state }`. No-op when `enabled=false` (so the hook stays quiet in mock mode).

**`src/components/Providers.tsx`** — wraps the app in `QueryClientProvider`, listens for the logout event.

### Migrating a page from mock-state to live data

Before:
```tsx
const [rows, setRows] = useState(STUDENTS);
// ... mutations call setRows() directly
```

After:
```tsx
const { data: rows = [], isLoading, error } = useStudents();
const createMut = useCreateStudent();

createMut.mutate(form, { onSuccess: () => setMode(null) });
// → automatic re-fetch of students query, no manual setRows()
```

See `/admin/students` for the canonical CRUD example (full create / edit / deactivate with loading + error states), and `/teacher` for the STOMP-driven live counters example.

### Routes already wired

| Path | Pattern | Notes |
|---|---|---|
| `/login` | mutation | Uses `api.auth.login`, redirects on success |
| `/admin` | useQuery | Stat counters from `useAdminDashboard()` |
| `/admin/students` | useQuery + useMutation | **Canonical CRUD example** |
| `/teacher` | useQuery + STOMP | **Canonical realtime example** |
| `/student/history` | (export button only) | Wired to `api.reports.downloadStudent` |
| `/admin/reports`, `/teacher/reports` | downloads | Direct fetch with auth header |

### Routes still on local-state mocks

`/admin/teachers`, `/admin/courses`, `/admin/sections`, `/admin/alerts`, `/admin/devices`, `/student`, `/student/courses`, `/student/attendance`, `/teacher/sessions` — these still use `useState(MOCK_FIXTURE)` and follow obvious patterns once you've seen the two canonical pages above. Migration is mechanical: replace `useState(MOCK)` with the appropriate `useQuery` from `hooks.ts`, and any state mutations with `useMutation`.



| Path | Role | Status |
|---|---|---|
| `/login` | public | **Done** — branded split-screen layout with demo-credential chips |
| `/admin` | ADMIN | **Done** — institution stats, trend, departments, alerts, defaulters |
| `/admin/students` | ADMIN | **Done** — full CRUD with tabs, search, modal forms, deactivate |
| `/admin/teachers` | ADMIN | **Done** — full CRUD |
| `/admin/courses` | ADMIN | **Done** — full CRUD with delete-confirmation |
| `/admin/sections` | ADMIN | **Done** — list, add, delete (blocks delete if not empty) |
| `/admin/alerts` | ADMIN | **Done** — master/detail inbox with risk meter and resolve flow |
| `/admin/devices` | ADMIN | **Done** — approve / block / remove trusted devices |
| `/teacher` | TEACHER | **Done** — matches reference image |
| `/teacher/sessions` | TEACHER | **Done** — session grid with live progress bars and status tabs |
| `/student` | STUDENT | **Done** — live session CTA, breakdown, course progress |
| `/student/attendance` | STUDENT | **Done** — 3-step mark flow (code → face → submit) with countdown |
| `/student/courses` | STUDENT | **Done** — course grid with attendance progress |
| `/student/history` | STUDENT | **Done** — full record with status + course filters, pagination, **working PDF/Excel/CSV export menu** |
| `/admin/reports` | ADMIN | **Done** — every report type with format pickers + download |
| `/teacher/reports` | TEACHER | **Done** — course / range / defaulters with format pickers |

## File layout

```
src/
├── app/
│   ├── layout.tsx           # root html + global styles
│   ├── page.tsx             # role-based redirect
│   ├── globals.css          # theme tokens, glass utilities, grain overlay
│   ├── login/
│   ├── admin/{layout,page}
│   ├── teacher/{layout,page}
│   └── student/{layout,page}
├── components/
│   ├── icons/Logo.tsx           # custom A+checkmark mark
│   ├── ui/{Button,Card,Input,Badge}
│   ├── layout/{Sidebar,Topbar,DashboardLayout}
│   ├── dashboard/StatCard
│   └── charts/{DonutChart,TrendChart}
├── lib/
│   ├── api.ts               # fetch wrapper + mock fallback
│   └── cn.ts                # className merger
├── store/authStore.ts       # Zustand auth state
└── types/api.ts             # API contract types
```

## Notes for production

- Replace mock data in dashboard pages with real API calls. The `lib/api.ts` client already handles real backend wiring; just add typed methods (e.g. `api.adminDashboard()`).
- The Topbar logout calls the backend logout endpoint to revoke the refresh token. In mock mode it's a no-op.
- Add a `react-query` provider in the root layout once you start fetching real data — useful for caching and retries.
