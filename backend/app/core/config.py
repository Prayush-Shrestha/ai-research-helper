"""Application configuration loaded from environment variables.

Run the backend from the backend/ directory so relative paths
(UPLOAD_DIRECTORY, alembic.ini) resolve as documented in the README.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "development"
    DATABASE_URL: str = (
        "postgresql+psycopg://researchos:researchos@localhost:5432/researchos"
    )
    SECRET_KEY: str = "dev-only-change-me"

    FRONTEND_ORIGIN: str = "http://localhost:3002"
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000

    UPLOAD_DIRECTORY: str = "storage"
    MAX_UPLOAD_SIZE_MB: int = 15

    SESSION_COOKIE_NAME: str = "ros_session"
    SESSION_EXPIRE_DAYS: int = 7
    # Comma-separated emails that automatically hold the admin role
    # (promoted on register and on login, so existing accounts pick it up
    # as soon as the env var is set). Admins get the /api/v1/admin console.
    ADMIN_EMAILS: str = ""
    # slowapi limit string for the auth endpoints (raised in tests via env).
    AUTH_RATE_LIMIT: str = "10/minute"
    # None means: True in production, False otherwise. Set explicitly to
    # override (local HTTPS testing, cookies over plain HTTP, ...).
    COOKIE_SECURE: bool | None = None

    # ------------------------------------------------------------------
    # RAG / AI configuration
    # ------------------------------------------------------------------
    # Embedding provider: "local" (deterministic, no API key), "openai",
    # or "ollama". Local provider works offline and is used by tests.
    EMBEDDING_PROVIDER: str = "local"
    EMBEDDING_MODEL: str = "local-simhash-v1"
    # LLM provider: "local" (extractive, no API key), "openai", or "ollama".
    LLM_PROVIDER: str = "local"
    LLM_MODEL: str = "local-extractive-v1"
    # Provider API keys — never hardcoded; must be set via environment.
    OPENAI_API_KEY: str | None = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    # RAG behaviour.
    RAG_CHUNK_SIZE: int = 1000
    RAG_CHUNK_OVERLAP: int = 200
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.30
    RAG_MAX_QUESTION_CHARS: int = 2000
    RAG_MAX_CONTEXT_CHARS: int = 6000
    # Rate limit for RAG ask endpoint (requests per minute).
    RAG_RATE_LIMIT: str = "30/minute"
    # Upstream provider request timeout in seconds.
    RAG_REQUEST_TIMEOUT: int = 60
    # Track AI usage per user.
    RAG_TRACK_USAGE: bool = True

    @property
    def cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.ENV == "production"

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def admin_emails(self) -> set[str]:
        """Lowercased allowlist of admin emails (empty set = no admins)."""
        return {
            part.strip().lower()
            for part in self.ADMIN_EMAILS.split(",")
            if part.strip()
        }

    @property
    def openai_api_key(self) -> str | None:
        return self.OPENAI_API_KEY


@lru_cache
def get_settings() -> Settings:
    return Settings()
