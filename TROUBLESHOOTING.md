# Troubleshooting

The most common errors students hit, with copy-paste fixes.

## 1. `'docker' is not recognized` / `command not found: docker`

You don't have Docker installed. Two options:

- **Install Docker Desktop** from https://docker.com/products/docker-desktop, then run `docker compose up -d` again.
- **OR skip Docker** — use `quick-demo.sh` (Mac/Linux) or `quick-demo.bat` (Windows) to run just the frontend in mock mode. You only need Node.js.

## 2. Docker says "Cannot connect to the Docker daemon"

Docker Desktop is installed but not running. Open Docker Desktop, wait for the whale icon to stop animating, then retry.

## 3. `Error response from daemon: ports are not available`

Some other program is already using one of the ports (3000, 3306, 8000, 8080). Either:

- Stop the other program, **or**
- Edit `.env` to use different host ports:

  ```bash
  cp .env.example .env
  ```

  Then change inside `.env`:

  ```
  FRONTEND_HOST_PORT=3100
  BACKEND_HOST_PORT=8180
  AI_HOST_PORT=8100
  DB_HOST_PORT=3406
  ```

  Re-run `docker compose up -d` and use the new ports in your browser.

## 4. `EADDRINUSE` when running `npm run dev`

Port 3000 is busy. Either stop the other process or override the port:

```bash
PORT=3100 npm run dev          # Mac/Linux
set PORT=3100 && npm run dev   # Windows
```

## 5. `npm install` hangs or fails

Network issue. Try:

```bash
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
```

If you're behind a university proxy, configure npm to use it:

```bash
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port
```

## 6. Backend logs say `Communications link failure` (MySQL)

The backend can't reach MySQL. Check:

- Is MySQL actually running? (`mysql -u root -p` should connect)
- Did you create the `attendai` database and user? (See MANUAL_SETUP.md step 1)
- If using Docker, did the `mysql` container reach healthy state? Run `docker compose ps` and look at the STATUS column.

## 7. First Docker build takes forever / appears stuck

It's not stuck — the first build downloads:

- Maven dependencies for the backend (~100 MB)
- npm packages for the frontend (~200 MB)
- pip packages for the AI service (~150 MB)
- MySQL 8 base image (~600 MB)

On a slow connection this can take 10–20 minutes. Watch progress with `docker compose logs -f`. Subsequent builds reuse cached layers and complete in seconds.

## 8. Browser says "This site can't be reached" on http://localhost:3000

The frontend container exists but isn't ready yet. Check status:

```bash
docker compose ps
```

If the `frontend` row says `(health: starting)`, wait another 30 seconds. If it's stuck on `restarting`, check its logs:

```bash
docker compose logs frontend
```

## 9. Login page accepts credentials but dashboard is empty / shows errors

In Docker mode this is usually the frontend trying to call `http://localhost:8080` from inside the container instead of from your browser. Make sure:

- `BACKEND_PUBLIC_URL=http://localhost:8080` in `.env`
- The backend's `/swagger-ui.html` actually loads in your browser
- Browser console (F12 → Network tab) shows requests going to `http://localhost:8080` and getting 200 OK

If you see CORS errors, set `FRONTEND_PUBLIC_URL` in `.env` to whatever URL your browser shows, then `docker compose up -d backend` to restart it.

## 10. "I just need it to look like it works for my demo"

Use the **quick demo** path:

```bash
./quick-demo.sh        # Mac/Linux
quick-demo.bat         # Windows
```

This starts only the frontend in mock mode. Every dashboard, every screen, every interaction works — but data is canned and resets when you refresh. Perfectly fine for showing a supervisor what the system looks like.

---

## Still stuck?

When asking for help, paste:

1. The OS you're on (Windows / Mac / Linux)
2. The command you ran
3. The last 20 lines of error output (not a screenshot — actual text)

Without those three things, nobody can help you.
