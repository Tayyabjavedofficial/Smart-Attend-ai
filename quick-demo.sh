#!/usr/bin/env bash
# AttendAI - quick demo (frontend mock mode, no backend required)
#
# This script gets the UI running in the fewest possible steps.
# It uses the frontend's built-in mock mode, so no database, no Java,
# no Python service - just Node.js.

set -e

cd "$(dirname "$0")"

echo ""
echo "===================================================="
echo "  AttendAI - Quick Demo (frontend mock mode)"
echo "===================================================="
echo ""

# ---- Check Node.js is installed ----
if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js is not installed."
    echo ""
    echo "Install it from https://nodejs.org and try again."
    echo "You need version 20 or newer."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "WARNING: Node.js v$NODE_VERSION detected. v20+ is recommended."
    echo "If something breaks, upgrade Node from https://nodejs.org"
    echo ""
fi

cd attendai-frontend

# ---- Set mock mode (no backend) ----
if [ ! -f .env.local ]; then
    cat > .env.local <<EOF
NEXT_PUBLIC_MOCK=true
NEXT_PUBLIC_API_BASE=http://localhost:8080
EOF
    echo "Created .env.local with NEXT_PUBLIC_MOCK=true (no backend needed)"
fi

# ---- Install dependencies if missing ----
if [ ! -d node_modules ]; then
    echo "Installing dependencies (this happens once, takes 1-2 minutes)..."
    npm install --no-audit --no-fund
    echo "Dependencies installed."
fi

echo ""
echo "===================================================="
echo "  Starting AttendAI on http://localhost:3000"
echo "===================================================="
echo ""
echo "  Demo logins:"
echo "    Admin    admin@attendai.local      Admin@12345"
echo "    Teacher  sarah.johnson@inst.edu    Teacher@123"
echo "    Student  aarav.sharma@inst.edu     Student@123"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

npm run dev
