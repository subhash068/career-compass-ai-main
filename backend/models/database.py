import os
import redis
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv

# DATABASE_URL = os.getenv("DATABASE_URL_DEV", "mysql+mysqlconnector://root:kali@localhost/career_compass")

load_dotenv()

# -------------------------
# Declarative Base
# -------------------------
Base = declarative_base()

# -------------------------
# Database URL (single source of truth)
# -------------------------
def get_database_url() -> str:
    env = os.getenv("ENVIRONMENT", "development").lower()

    if env == "production":
        return os.getenv(
            "DATABASE_URL_PROD",
            "mysql+mysqlconnector://root:kali@localhost/career_compass",
        )
    elif env == "test":
        return os.getenv(
            "DATABASE_URL_TEST",
            "sqlite:///./test_career_compass.db",
        )
    else:
        return os.getenv(
            "DATABASE_URL_DEV",
            "sqlite:///./career_compass.db",
        )


DATABASE_URL = get_database_url()
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# -------------------------
# SQLAlchemy Engine
# -------------------------
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool if not IS_SQLITE else None,
    pool_pre_ping=True,
    pool_size=10 if not IS_SQLITE else None,
    max_overflow=20 if not IS_SQLITE else None,
    echo=os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true",
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)

# -------------------------
# Session Factory
# -------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# -------------------------
# Redis Singleton
# -------------------------
class RedisConnection:
    _instance = None
    _redis_client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def connect(self):
        if self._redis_client is None:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            try:
                client = redis.from_url(redis_url, socket_connect_timeout=5)
                client.ping()
                self._redis_client = client
            except Exception as e:
                print(f"[WARN] Redis unavailable: {e}")
                self._redis_client = None
        return self._redis_client


redis_client = RedisConnection()


def get_redis():
    return redis_client.connect()

# -------------------------
# FastAPI DB Dependency
# -------------------------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# -------------------------
# Dev/Test ONLY
# -------------------------
def create_tables():
    """
    ⚠️ Dev/Test ONLY
    Use Alembic in production.
    """
    Base.metadata.create_all(bind=engine)
