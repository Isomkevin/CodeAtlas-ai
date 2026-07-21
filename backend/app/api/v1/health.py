"""Liveness and readiness endpoints for orchestrators and deployments."""

from fastapi import APIRouter, Depends, HTTPException
from neo4j import AsyncGraphDatabase
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text

from app.config import Settings, get_settings
from app.database import create_session_factory

router = APIRouter(tags=["platform"])


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


@router.get("/health", response_model=HealthResponse, summary="Liveness probe")
async def health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Confirm that the API process is running."""

    return HealthResponse(status="ok", service=settings.app_name, environment=settings.environment)


@router.get("/ready", response_model=HealthResponse, summary="Readiness probe")
async def ready(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Confirm that the API has completed startup.

    Check each configured durable dependency before declaring the process ready.
    """

    try:
        if settings.database_url:
            session_factory = create_session_factory(settings.database_url)
            async with session_factory() as session:
                await session.execute(text("SELECT 1"))
        if settings.neo4j_uri:
            driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_username, settings.neo4j_password.get_secret_value()),
            )
            try:
                await driver.verify_connectivity()
            finally:
                await driver.close()
        if settings.redis_url:
            redis = Redis.from_url(settings.redis_url)
            try:
                await redis.ping()
            finally:
                await redis.aclose()
    except Exception as error:
        raise HTTPException(
            status_code=503, detail="A required platform dependency is unavailable"
        ) from error
    return HealthResponse(
        status="ready", service=settings.app_name, environment=settings.environment
    )
