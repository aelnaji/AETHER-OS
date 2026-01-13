# syntax=docker/dockerfile:1.6

FROM node:18-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
RUN apk add --no-cache libc6-compat
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

RUN npm run build

FROM base AS runner
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

FROM base AS dev
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
