# Manual Setup (Option 3)

Use this when neither Docker nor a Node-only demo is enough — you want the **full real stack** but Docker can't be installed (university lab restrictions, etc).

You'll need **four terminal windows** and the following installed system-wide:

| Tool | Version | Install link |
|---|---|---|
| Java | 17+ | https://adoptium.net |
| Node.js | 20+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| MySQL | 8+ | https://dev.mysql.com/downloads |
| Maven | 3.9+ | (bundled with Spring Boot project — use `./mvnw`) |

## Step 1 — Create the database

In a MySQL shell (`mysql -u root -p`):

```sql
CREATE DATABASE attendai CHARACTER SET utf8mb4;
CREATE USER 'attendai'@'localhost' IDENTIFIED BY 'attendai';
GRANT ALL PRIVILEGES ON attendai.* TO 'attendai'@'localhost';
FLUSH PRIVILEGES;
```

## Step 2 — Terminal 1: AI service

```bash
cd attendai-ai-service

# Create virtualenv (one-time)
python3 -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate

# Install deps (one-time)
pip install -r requirements.txt

# Run it
uvicorn app.main:app --port 8000 --reload
```

Verify: open http://localhost:8000/docs — you should see the FastAPI Swagger UI.

## Step 3 — Terminal 2: Backend (Spring Boot)

```bash
cd attendai-backend

# Mac/Linux:
./mvnw spring-boot:run

# Windows:
mvnw.cmd spring-boot:run
```

First run downloads ~100 MB of Maven dependencies — takes 2-5 minutes. Subsequent runs start in ~10 seconds.

Verify: open http://localhost:8080/swagger-ui.html — Spring's API docs.

If you see "Communications link failure" — MySQL isn't running or the credentials don't match. Edit `attendai-backend/src/main/resources/application-dev.yml` if you used different credentials in Step 1.

## Step 4 — Terminal 3: Frontend

```bash
cd attendai-frontend

# Switch out of mock mode so it hits the real backend
echo "NEXT_PUBLIC_MOCK=false" > .env.local
echo "NEXT_PUBLIC_API_BASE=http://localhost:8080" >> .env.local

# Install deps (one-time)
npm install

# Run it
npm run dev
```

Verify: open http://localhost:3000 — the login screen.

## Step 5 — Log in

The backend's Flyway migration seeded an admin user on first boot:

| Email | Password |
|---|---|
| `admin@attendai.local` | `Admin@12345` |

Once logged in as admin, you can create teacher and student accounts from the Students / Teachers pages.

## Common gotchas

- **Ports clash** — if 3000 / 8080 / 8000 / 3306 are already in use, kill whatever's using them or change the ports.
- **Flyway version mismatch** — if you tried this before with a different schema, drop and recreate the `attendai` database.
- **CORS errors in browser console** — the backend whitelists `http://localhost:3000` by default. If you're running the frontend on a different port, set `CORS_ORIGINS=http://localhost:YOUR_PORT` before starting the backend.
