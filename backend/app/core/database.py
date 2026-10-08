"""
database.py
-----------
Sets up the SQLAlchemy engine and session factory.
Provides:
  - `engine`      : connects to PostgreSQL
  - `SessionLocal`: factory for creating DB sessions
  - `Base`        : base class for all ORM models
  - `get_db()`    : FastAPI dependency that yields a session per request
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create the SQLAlchemy engine using the DATABASE_URL from .env
engine = create_engine(
    settings.database_url,
    # Keeps connections alive and reconnects if dropped
    pool_pre_ping=True
)

# Session factory — each request gets its own session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class — all models will inherit from this
Base = declarative_base()


def get_db():
    """
    FastAPI dependency.
    Yields a database session and ensures it's closed after the request,
    even if an exception occurs.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()