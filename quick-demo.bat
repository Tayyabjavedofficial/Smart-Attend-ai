@echo off
REM AttendAI - quick demo (frontend mock mode, no backend required)
REM This script gets the UI running in the fewest possible steps.

setlocal
cd /d "%~dp0"

echo.
echo ====================================================
echo   AttendAI - Quick Demo (frontend mock mode)
echo ====================================================
echo.

REM ---- Check Node.js is installed ----
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed.
    echo.
    echo Install it from https://nodejs.org and try again.
    echo You need version 20 or newer.
    pause
    exit /b 1
)

cd attendai-frontend

REM ---- Set mock mode (no backend) ----
if not exist .env.local (
    (
        echo NEXT_PUBLIC_MOCK=true
        echo NEXT_PUBLIC_API_BASE=http://localhost:8080
    ) > .env.local
    echo Created .env.local with NEXT_PUBLIC_MOCK=true ^(no backend needed^)
)

REM ---- Install dependencies if missing ----
if not exist node_modules (
    echo Installing dependencies ^(this happens once, takes 1-2 minutes^)...
    call npm install --no-audit --no-fund
    if errorlevel 1 (
        echo.
        echo ERROR: npm install failed. Check your network connection.
        pause
        exit /b 1
    )
    echo Dependencies installed.
)

echo.
echo ====================================================
echo   Starting AttendAI on http://localhost:3000
echo ====================================================
echo.
echo   Demo logins:
echo     Admin    admin@attendai.local      Admin@12345
echo     Teacher  sarah.johnson@inst.edu    Teacher@123
echo     Student  aarav.sharma@inst.edu     Student@123
echo.
echo   Press Ctrl+C to stop.
echo.

call npm run dev
