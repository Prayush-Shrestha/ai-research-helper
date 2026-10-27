# Lumina backend — FastAPI service.
# Build:  docker build -t lumina-backend -f backend/Dockerfile backend
# Run:    docker run -p 8000:8000 --env-file backend/.env lumina-backend

FROM python:3.13-slim AS builder

WORKDIR /app

# Install build dependencies for compiling psycopg/argon2 etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

FROM python:3.13-slim AS runtime

WORKDIR /app

# Runtime dependencies (libpq for psycopg).
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/ \
    && groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./

# Upload storage (created at runtime via volume or default).
ENV UPLOAD_DIRECTORY=/app/storage
ENV DATABASE_URL=postgresql+psycopg://researchos:researchos@localhost:5432/researchos
ENV ENV=production
ENV BACKEND_HOST=0.0.0.0
ENV BACKEND_PORT=8000
ENV SESSION_COOKIE_NAME=ros_session
ENV SESSION_EXPIRE_DAYS=7
# COOKIE_SECURE must be true in production (HTTPS). Set via env.
# SECRET_KEY must be set via env (never hardcoded).
# ADMIN_EMAILS must be set via env for admin access.
# FRONTEND_ORIGIN must be set to the production frontend URL.
# OPENAI_API_KEY only when using the openai provider.

RUN mkdir -p /app/storage && chown appuser:appuser /app/storage

USER appuser

EXPOSE 8000

# Run migrations then start the server.
CMD ["sh", "-c", "python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"]
