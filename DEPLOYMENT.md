# AETHER-OS Deployment Guide (Docker)

This repository contains the **AETHER-OS Next.js frontend**.

It can run standalone (UI-only) or connect to an external **Bytebot backend** (Socket.IO) using `NEXT_PUBLIC_BYTEBOT_ENDPOINT`.

## Testing & Quality Assurance

The project includes comprehensive testing infrastructure to ensure reliability and stability.

### Running Tests

#### Unit Tests
```bash
npm run test:unit
```

Tests individual components and services in isolation.

#### Integration Tests
```bash
npm run test:integration
```

Tests interactions between components and Socket.IO communication.

#### Full Test Suite with Coverage
```bash
npm run test:coverage
```

Runs all tests and generates coverage reports. Target: 80%+ coverage.

#### Watch Mode (Development)
```bash
npm run test:watch
```

Runs tests in watch mode for active development.

### Test Coverage

The project aims for **80%+ code coverage** on critical paths:

- `lib/services/shellService.ts` - Shell command execution
- `lib/services/aptService.ts` - Package management
- `lib/hooks/useTerminal.ts` - Terminal session management

Coverage reports are generated in the `coverage/` directory.

### CI/CD Pipeline

The project includes a comprehensive GitHub Actions workflow (`.github/workflows/test.yml`) that:

1. **Linting**: Code quality checks
2. **Unit Tests**: Individual component testing
3. **Integration Tests**: Component interaction testing
4. **Build**: Production build verification
5. **Docker Build**: Container image creation
6. **Docker Compose Test**: Multi-container deployment testing
7. **Coverage Reporting**: Test coverage analysis

The pipeline runs on every push to `main` and pull requests.

## Test Structure

```
tests/
├── unit/                  # Unit tests
│   ├── services/          # Service layer tests
│   │   ├── shellService.test.ts
│   │   └── aptService.test.ts
│   └── hooks/             # React hook tests
│       └── useTerminal.test.ts
└── integration/           # Integration tests
    ├── socketIntegration.test.ts
    └── healthEndpoints.test.ts
```

### Mocking Strategy

- **Socket.IO**: Mocked using Jest for reliable testing without backend dependency
- **Environment**: Test environment variables can be overridden
- **Timing**: Tests handle asynchronous operations with proper timeouts

### Writing New Tests

1. Place unit tests in `tests/unit/` following the same directory structure as source
2. Place integration tests in `tests/integration/`
3. Use the existing mock setup for Socket.IO
4. Aim for comprehensive coverage of happy paths and error cases

## Development Testing Tips

- Use `npm run test:watch` for active development
- Focus on edge cases: network failures, timeouts, invalid inputs
- Test both success and failure scenarios
- Ensure tests are deterministic and don't rely on external services

## Prerequisites

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

### Enhanced Production Setup

The `docker-compose.prod.yml` now includes a complete production stack:

```yaml
services:
  aether-os:      # Main application
  postgres:       # PostgreSQL database
  redis:          # Redis caching
  nginx:          # Reverse proxy with SSL
```

### Key Improvements

1. **Multi-Service Architecture**: Full stack including database and caching
2. **Resource Optimization**: Proper CPU/memory limits and reservations
3. **Health Checks**: Comprehensive health monitoring for all services
4. **Logging**: Structured JSON logging with rotation
5. **Security**: Non-root user, proper permissions
6. **Scalability**: Ready for Kubernetes deployment

### Service Details

#### AETHER-OS Application
- **Port**: 3000 (configurable via `AETHER_OS_PORT`)
- **Resources**: 1.5 CPU / 768MB memory (limits)
- **Health Check**: `/api/health` endpoint monitoring
- **Volumes**: Persistent data and logs

#### PostgreSQL Database
- **Image**: `postgres:15-alpine` (optimized)
- **Port**: 5432 (internal only)
- **Resources**: 0.5 CPU / 256MB memory
- **Persistence**: Volume-mounted data directory

#### Redis Cache
- **Image**: `redis:7-alpine` (optimized)
- **Port**: 6379 (internal only)
- **Resources**: 0.25 CPU / 128MB memory
- **Persistence**: Volume-mounted data

#### Nginx Reverse Proxy
- **Image**: `nginx:1.25-alpine` (optimized)
- **Ports**: 80 (HTTP) → 443 (HTTPS)
- **Features**: SSL termination, WebSocket support, caching
- **Configuration**: Custom `docker/nginx.conf`

## Environment Files

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

### New Environment Variables

**Database Configuration:**
- `POSTGRES_USER`: PostgreSQL username (default: `postgres`)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: `postgres`)
- `POSTGRES_DB`: PostgreSQL database name (default: `aether`)

**Network Configuration:**
- `NGINX_HTTP_PORT`: HTTP port for Nginx (default: `80`)
- `NGINX_HTTPS_PORT`: HTTPS port for Nginx (default: `443`)

**Resource Tuning:**
- `AETHER_OS_PORT`: AETHER-OS application port (default: `3000`)

### Important: NEXT_PUBLIC variables are build-time

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

### Database Management

```bash
# Access PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/aether

# Backup database
docker exec -t aether-os-postgres-1 pg_dump -U postgres aether > backup.sql

# Restore database
cat backup.sql | docker exec -i aether-os-postgres-1 psql -U postgres aether
```

### Logs Management

```bash
# View all service logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f aether-os

# View logs with timestamps
docker compose -f docker-compose.prod.yml logs -f --timestamps

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Health Monitoring

```bash
# Check individual service health
docker inspect --format='{{json .State.Health}}' aether-os-aether-os-1

# View health check logs
docker compose -f docker-compose.prod.yml logs -f | grep health

# Manual health check
curl -i http://localhost:3000/api/health
```

## Reverse Proxy / Custom Domain (optional)

The enhanced setup now includes **Nginx as part of the Docker Compose stack** with comprehensive configuration.

### Built-in Nginx Features

- **SSL/TLS Termination**: Full HTTPS support with modern cipher suites
- **HTTP/2 Support**: Improved performance
- **WebSocket Proxying**: Full Socket.IO support
- **Caching**: Static asset caching with proper headers
- **Security Headers**: CSP, XSS protection, etc.
- **Health Check Bypass**: Direct access to health endpoints
- **Gzip Compression**: Reduced bandwidth usage

### Custom Nginx Configuration

The configuration file is located at `docker/nginx.conf` and includes:

- **Optimized performance settings**: Sendfile, keepalive, buffer tuning
- **Security headers**: CSP, X-Frame-Options, XSS protection
- **Proxy settings**: Proper timeouts and buffering
- **Caching strategies**: Long-term caching for static assets
- **Error handling**: Custom error pages
- **Health check endpoints**: Special handling for monitoring

### SSL Certificate Setup

1. **Create SSL directory**:
   ```bash
   mkdir -p docker/ssl
   ```

2. **Place certificates**:
   - `docker/ssl/fullchain.pem` - Full certificate chain
   - `docker/ssl/privkey.pem` - Private key

3. **Generate self-signed cert (development)**:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout docker/ssl/privkey.pem \
     -out docker/ssl/fullchain.pem \
     -subj "/CN=localhost"
   ```

### Custom Domain Configuration

To use a custom domain:

1. **Update Nginx config**: Modify `server_name` in `docker/nginx.conf`
2. **Set up DNS**: Point your domain to the server IP
3. **Obtain SSL certificates**: Use Let's Encrypt or your CA
4. **Update compose file**: Adjust port mappings if needed

### Nginx Management

```bash
# Access Nginx container
docker exec -it aether-os-nginx-1 sh

# Reload Nginx configuration
docker exec -it aether-os-nginx-1 nginx -s reload

# Test Nginx configuration
docker exec -it aether-os-nginx-1 nginx -t
```

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
   - Database connection issues
   - Redis connection failures

### Multi-Service Troubleshooting

#### Database Connection Issues

```bash
# Check PostgreSQL health
docker compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker run --network aether-net postgres:15-alpine psql -h postgres -U postgres -c "SELECT 1"

# Check database readiness
curl -i http://localhost:3000/api/health | grep database
```

#### Redis Connection Issues

```bash
# Check Redis health
docker compose -f docker-compose.prod.yml logs redis

# Test Redis connection
docker run --network aether-net redis:7-alpine redis-cli -h redis ping
```

#### Nginx Issues

```bash
# Check Nginx logs
docker compose -f docker-compose.prod.yml logs nginx

# Test Nginx configuration
docker exec -it aether-os-nginx-1 nginx -t

# Check Nginx connectivity
curl -v http://localhost
```

### Network Connectivity

```bash
# Test internal DNS resolution
docker run --network aether-net alpine ping -c 4 aether-os

# Test service-to-service communication
docker run --network aether-net curlimages/curl curl -v http://aether-os:3000/api/health

# Check network configuration
docker network inspect aether-net
```

### Resource Constraints

```bash
# Check container resource usage
docker stats aether-os-aether-os-1

# Adjust resource limits in docker-compose.prod.yml
# Increase memory limits if seeing OOM kills
```

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

### Database Migration Issues

```bash
# Check for pending migrations
# (Add migration commands specific to your setup)

# Reset database (careful!)
docker compose -f docker-compose.prod.yml down -v
```

### SSL/TLS Issues

```bash
# Test SSL configuration
openssl s_client -connect localhost:443 -servername localhost

# Check certificate validity
docker exec -it aether-os-nginx-1 openssl x509 -in /etc/nginx/ssl/fullchain.pem -text -noout
```

## Kubernetes readiness

The app already exposes:

- `/api/liveness`
- `/api/readiness`

These map directly to Kubernetes probes.
