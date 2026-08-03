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


HARD_DEPENDENCIES = ("postgres", "redis")
"""Deps that must be reachable at startup — the API cannot serve identity or
scan events without them. Neo4j is a soft dep (only the graph endpoint uses
it); Neo4j Aura Free hibernates on idle and would otherwise block every
Render redeploy indefinitely."""


@router.get("/ready", response_model=HealthResponse, summary="Readiness probe")
async def ready(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Confirm the API can start serving requests.

    Hard deps (Postgres + Redis) must be reachable. Soft deps (Neo4j) are
    probed for logging but their failure does not fail readiness — the graph
    endpoint will surface the outage where the user actually needs graph data.
    """

    probes: list[tuple[str, callable]] = []
    if settings.database_url:
        probes.append(("postgres", _check_postgres))
    if settings.redis_url:
        probes.append(("redis", _check_redis))
    if settings.neo4j_uri:
        probes.append(("neo4j", _check_neo4j))

    hard_failures: dict[str, str] = {}
    soft_failures: dict[str, str] = {}
    for name, probe in probes:
        try:
            await probe(settings)
        except Exception as error:
            detail = f"{type(error).__name__}: {error}"
            logger.warning("readiness_dependency_unavailable", dependency=name, error=str(error))
            if name in HARD_DEPENDENCIES:
                hard_failures[name] = detail
            else:
                soft_failures[name] = detail

    if hard_failures:
        raise HTTPException(status_code=503, detail={"unavailable": hard_failures})
    if soft_failures:
        logger.info("readiness_soft_deps_unavailable", unavailable=list(soft_failures.keys()))
    return HealthResponse(
        status="ready", service=settings.app_name, environment=settings.environment
    )
