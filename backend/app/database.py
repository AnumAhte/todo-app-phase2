from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator
import ssl

from app.config import settings


def get_database_url() -> str:
    """Get and format the database URL for asyncpg."""
    url = settings.DATABASE_URL
    # Ensure we're using asyncpg driver
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://")
    # Remove sslmode parameter as asyncpg handles it differently
    if "sslmode=" in url:
        url = url.split("?")[0]
    if "ssl=" in url:
        url = url.split("?")[0]
    return url


# Create SSL context for Neon PostgreSQL
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Create async engine with asyncpg
engine = create_async_engine(
    get_database_url(),
    echo=True,
    connect_args={"ssl": ssl_context}
)

# Create async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI to get database session.

    Usage:
        @app.get("/items")
        async def read_items(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session() as session:
        yield session


async def create_db_and_tables():
    """
    Create all database tables based on SQLModel metadata.
    Should be called on application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
