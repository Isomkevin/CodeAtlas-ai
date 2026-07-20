"""Liveness and readiness endpoints for orchestrators and deployments."""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel

from app.config import Settings, get_settings

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

    Dependency checks are added alongside each provisioned adapter so readiness
    reflects only dependencies the deployed feature set actually requires.
    """

    return HealthResponse(status="ready", service=settings.app_name, environment=settings.environment)
