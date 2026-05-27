# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the AttendAI Next.js frontend.
#
# Two important notes about Next.js + Docker:
#   1. NEXT_PUBLIC_* vars are baked into the bundle at BUILD time, not at
#      run time. The API base URL is passed as a build-arg, defaulting to
#      http://localhost:8080 which is what the user's browser sees when the
#      backend is mapped to host port 8080.
#   2. `output: "standalone"` (next.config.js) ships only the files the app
#      actually needs - ~50 MB instead of the full node_modules tree.

# ----- Build stage -----
FROM node:20-alpine AS build
WORKDIR /build

# Install with the lockfile for reproducibility. Use `ci` not `install`.
COPY package*.json ./
RUN npm ci

# Build-time public env vars baked into the bundle.
ARG NEXT_PUBLIC_API_BASE=http://localhost:8080
ARG NEXT_PUBLIC_MOCK=false
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_MOCK=$NEXT_PUBLIC_MOCK
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN npm run build

# ----- Runtime stage -----
FROM node:20-alpine

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Next.js standalone output puts a self-contained server in .next/standalone
# and static assets in .next/static + public/. Copy each piece explicitly.
COPY --from=build --chown=nextjs:nodejs /build/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /build/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /build/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/login 2>/dev/null | grep -q AttendAI || exit 1

CMD ["node", "server.js"]
