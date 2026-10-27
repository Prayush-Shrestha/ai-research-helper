# Lumina frontend — Next.js 16 App Router.
# Build:  docker build -t lumina-frontend -f frontend/Dockerfile frontend
# Run:    docker run -p 3002:3002 --env-file frontend/.env.local lumina-frontend

# ---------------------------------------------------------------- Deps ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

# ------------------------------------------------------------- Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .
# NEXT_PUBLIC_API_BASE_URL is baked in at build time for the browser client.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

# -------------------------------------------------------------- Runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# Next.js collects telemetry by default; disable it in production.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

# `next start` needs the app dir; HOSTNAME=0.0.0.0 binds to all interfaces.
CMD ["node", ".next/standalone/server.js"]
