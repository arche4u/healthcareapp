"""Database connection and session management."""
import os
from contextlib import contextmanager
from typing import Generator, Optional
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from sqlalchemy.pool import NullPool
from urllib.parse import quote_plus

# Import FHIR models for table creation
# These will be mapped to SQLAlchemy models
from ..fhir.models import (
    Patient, Practitioner, Organization, Encounter,
    Observation, MedicationRequest, DiagnosticReport, Consent
)


class Base(DeclarativeBase):
    pass


# Database URL from environment
def _build_database_url() -> str:
    """Build PostgreSQL connection URL from env vars."""
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    user = os.getenv("DB_USER", "onehealth")
    password = os.getenv("DB_PASSWORD", "onehealth")
    db_name = os.getenv("DB_NAME", "onehealth")
    # URL-encode password for special chars
    password_encoded = quote_plus(password)
    return f"postgresql+psycopg2://{user}:{password_encoded}@{host}:{port}/{db_name}"


DATABASE_URL = os.getenv("DATABASE_URL") or _build_database_url()

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # For serverless/dev; use QueuePool in prod
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)


def init_db() -> None:
    """Initialize database - create all tables."""
    # Import here to avoid circular imports
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_db_session() -> Generator[Session, None, None]:
    """Get database session (for FastAPI dependency injection)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    """Context manager for database session."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db() -> Session:
    """Get a database session (for direct use - remember to close)."""
    return SessionLocal()