"""Liveness and readiness endpoints for orchestrators and deployments."""

import structlog
from fastapi import APIRouter, Depends, HTTPException
from neo4j import AsyncGraphDatabase
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text

from app.config import Settings, get_settings
from app.database import create_session_factory

router = APIRouter(tags=["platform"])
logger = structlog.get_logger(__name__)


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


@router.get("/health", response_model=HealthResponse, summary="Liveness probe")
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Confirm that the API process is running."""

    return HealthResponse(status="ok", service=settings.app_name, environment=settings.environment)


async def _check_postgres(settings: Settings) -> None:
    session_factory = create_session_factory(settings.database_url)
    async with session_factory() as session:
        await session.execute(text("SELECT 1"))


async def _check_neo4j(settings: Settings) -> None:
    driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password.get_secret_value()),
    )
    try:
        await driver.verify_connectivity()
    finally:
        await driver.close()


async def _check_redis(settings: Settings) -> None:
    redis = Redis.from_url(settings.redis_url)
    try:
        await redis.ping()
    finally:
        await redis.aclose()


@router.get("/ready", response_model=HealthResponse, summary="Readiness probe")
async def ready(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Confirm that the API has completed startup.

    Each configured durable dependency is probed independently so the response
    names the specific dep that is unavailable; a swallowed exception hides
    which one failed and makes deploy triage impossible.
    """

    probes = []
    if settings.database_url:
        probes.append(("postgres", _check_postgres))
    if settings.neo4j_uri:
        probes.append(("neo4j", _check_neo4j))
    if settings.redis_url:
        probes.append(("redis", _check_redis))

    failures: dict[str, str] = {}
    for name, probe in probes:
        try:
            await probe(settings)
        except Exception as error:
            failures[name] = f"{type(error).__name__}: {error}"
            logger.warning("readiness_dependency_unavailable", dependency=name, error=str(error))

    if failures:
        raise HTTPException(status_code=503, detail={"unavailable": failures})
    return HealthResponse(
        status="ready", service=settings.app_name, environment=settings.environment
    )
