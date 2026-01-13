# AETHER-OS Deployment Guide (Docker)

This repository contains the **AETHER-OS Next.js frontend**.

It can run standalone (UI-only) or connect to an external **Bytebot backend** (Socket.IO) using `NEXT_PUBLIC_BYTEBOT_ENDPOINT`.

## Prerequisites

- Docker Engine 24+
- Docker Compose v2 (`docker compose`)
- Recommended system resources: 2 CPU / 4GB RAM

## Quick Start (5 minutes)

### Development (hot reload)

```bash
cp .env.local.example .env.local
# docker compose loads variables from an env file for substitution via --env-file
docker compose --env-file .env.local -f docker-compose.dev.yml up --build
```

Open:
- UI: http://localhost:3000
- Health: http://localhost:3000/api/health

### Production

```bash
cp .env.prod.example .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Open:
- UI: http://localhost:3000
- Readiness: http://localhost:3000/api/readiness

## Docker Compose Files

- `docker-compose.dev.yml`
  - Uses the `dev` stage from `Dockerfile`
  - Bind mounts the repo for hot reload
  - Creates named volumes for `node_modules` and `.next` cache

- `docker-compose.staging.yml`
  - Production build with staging env overrides
  - Default host port: `3002`

- `docker-compose.prod.yml`
  - Production build (`next build` + standalone runtime)
  - Default host port: `3000`

## Environment Files

This repo intentionally **does not commit real `.env.*` files**.

Use the examples:

- `.env.example` – full reference
- `.env.local.example` → copy to `.env.local` (dev)
- `.env.staging.example` → copy to `.env.staging`
- `.env.prod.example` → copy to `.env.prod`

### Required vs Optional

**Required for staging/production (unless you explicitly opt out):**

- `NEXT_PUBLIC_BYTEBOT_ENDPOINT` (or set `AETHER_ALLOW_NO_BYTEBOT=true`)

**Optional (but recommended):**

- `NEXT_PUBLIC_NVIDIA_API_ENDPOINT` (defaults to NVIDIA Integrate)
- `NEXT_PUBLIC_DEFAULT_MODEL`
- `HEALTHCHECK_TIMEOUT_MS`, `MIN_FREE_MEMORY_MB`

### Important: NEXT_PUBLIC variables are build-time

Next.js embeds `NEXT_PUBLIC_*` variables into the frontend bundle at **build time**.

For Docker, the compose files pass `NEXT_PUBLIC_*` variables as **build args** and also set them at runtime through the `environment:` block. Use `docker compose --env-file ...` to load values from an env file.

If you change any `NEXT_PUBLIC_*` values, rebuild:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml build --no-cache
```

## Health Checks

Endpoints:

- `GET /api/health` – basic health + dependency checks (returns 200 unless critically unhealthy)
- `GET /api/readiness` – readiness probe (returns 503 if critical deps are not ready)
- `GET /api/liveness` – liveness probe (always 200 if the server can respond)

Response format:

```json
{
  "status": "ok | degraded | unhealthy",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "version": "...",
  "environment": "development|staging|production",
  "checks": { "resources": { ... }, "bytebot": { ... }, "database": { ... } },
  "durationMs": 12
}
```

Docker health checks:

- Production uses `/api/health`
- Staging uses `/api/readiness`

## Logs

View logs:

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=200
```

Health check logs are structured JSON (`event: aether.health.*`).

## Operations

### Updating

```bash
docker compose -f docker-compose.prod.yml pull   # if using a registry image
docker compose -f docker-compose.prod.yml up -d --build
```

### Restart

```bash
docker compose -f docker-compose.prod.yml restart
```

### Stop / Cleanup

```bash
docker compose -f docker-compose.prod.yml down
# Remove volumes (will delete /app/data and caches)
docker compose -f docker-compose.prod.yml down -v
```

## Reverse Proxy / Custom Domain (optional)

For a custom domain, place a reverse proxy (nginx, Caddy, Traefik) in front of the container.

- Proxy to `http://aether-os:3000`
- Terminate TLS at the proxy

## Troubleshooting

### Container is "unhealthy"

1. Check health endpoints:
   - `curl -i http://localhost:3000/api/health`
   - `curl -i http://localhost:3000/api/readiness`
2. Inspect logs:
   - `docker compose -f docker-compose.prod.yml logs -f`
3. Common causes:
   - `NEXT_PUBLIC_BYTEBOT_ENDPOINT` points to a non-reachable backend
   - Very low free memory (`MIN_FREE_MEMORY_MB` too high for your host)

### Bytebot connection timeouts

- Confirm the backend is reachable from inside the container network.
- If Bytebot is running on the host machine:
  - Linux: use `http://host.docker.internal:3001` (may require extra Docker config)
  - Or run Bytebot in the same compose project/network

### Port conflicts

If `3000` is in use, set a different host port:

```bash
AETHER_OS_PORT=3010 docker compose -f docker-compose.prod.yml up -d --build
```

### Build is slow

- Ensure BuildKit is enabled (default in modern Docker).
- Avoid changing `package-lock.json` unnecessarily (dependency layer caching).
- Use `docker builder prune` occasionally to free space.

## Kubernetes readiness

The app already exposes:

- `/api/liveness`
- `/api/readiness`

These map directly to Kubernetes probes.
