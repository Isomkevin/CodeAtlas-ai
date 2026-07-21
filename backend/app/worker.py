"""Celery application for durable CodeAtlas background work."""

import asyncio
from uuid import UUID

from celery import Celery

from app.config import get_settings
from app.modules.repository.workers import execute_scan

settings = get_settings()
celery_app = Celery("codeatlas", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task(
    name="codeatlas.repository.scan",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def run_repository_scan(scan_id: str) -> None:
    if not settings.database_url:
        raise RuntimeError("Repository worker requires CODEATLAS_DATABASE_URL")
    asyncio.run(execute_scan(settings.database_url, UUID(scan_id), settings))
