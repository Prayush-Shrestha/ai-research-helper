"""SQLAlchemy engine and session factory (SQLAlchemy 2.x style)."""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

_settings = get_settings()

_connect_args = (
    {"check_same_thread": False} if _settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(
    _settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
)
