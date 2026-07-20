"""SQLAlchemy infrastructure shared by module repositories only."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings


def _async_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql+psycopg://"):
        return database_url.replace("postgresql+psycopg://", "postgresql+psycopg_async://", 1)
    return database_url


def create_session_factory(database_url: str) -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(_async_database_url(database_url), pool_pre_ping=True)
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncIterator[AsyncSession]:
    """Provide a transaction-scoped session to controllers that need persistence."""

    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError(
            "Database access was requested before CODEATLAS_DATABASE_URL was configured"
        )
    session_factory = create_session_factory(settings.database_url)
    async with session_factory() as session:
        yield session
