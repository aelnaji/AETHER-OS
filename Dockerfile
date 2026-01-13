# syntax=docker/dockerfile:1.6

FROM node:18-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Install build dependencies
FROM base AS deps
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Builder stage with optimized caching
FROM base AS builder
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_BYTEBOT_ENDPOINT=http://localhost:3001
ARG NEXT_PUBLIC_LLM_ENDPOINT=https://integrate.api.nvidia.com/v1
ARG NEXT_PUBLIC_NVIDIA_API_ENDPOINT=https://integrate.api.nvidia.com/v1
ARG NEXT_PUBLIC_DEFAULT_MODEL=meta/llama-3.1-405b-instruct
ARG NEXT_PUBLIC_CHAT_STREAMING=true
ARG NEXT_PUBLIC_APP_VERSION=dev

ENV NEXT_PUBLIC_BYTEBOT_ENDPOINT=${NEXT_PUBLIC_BYTEBOT_ENDPOINT}
ENV NEXT_PUBLIC_LLM_ENDPOINT=${NEXT_PUBLIC_LLM_ENDPOINT}
ENV NEXT_PUBLIC_NVIDIA_API_ENDPOINT=${NEXT_PUBLIC_NVIDIA_API_ENDPOINT}
ENV NEXT_PUBLIC_DEFAULT_MODEL=${NEXT_PUBLIC_DEFAULT_MODEL}
ENV NEXT_PUBLIC_CHAT_STREAMING=${NEXT_PUBLIC_CHAT_STREAMING}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Build the application
RUN npm run build

# Production runner stage - optimized for minimal size
FROM node:18-alpine AS runner
RUN apk add --no-cache dumb-init \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy only necessary files from builder
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Create non-root user
RUN addgroup -S nodejs && adduser -S -G nodejs nodejs
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Development stage
FROM base AS dev
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

# Test stage for CI/CD
FROM base AS test
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

ENV NODE_ENV=test

CMD ["npm", "run", "test"]
