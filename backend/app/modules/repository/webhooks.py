"""Verified GitHub webhook intake for graph-refresh scans."""

import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.repository.repository import RepositoryStore
from app.modules.repository.schemas import GitHubWebhookResponse
from app.modules.repository.service import RepositoryService
from app.worker import run_repository_scan

router = APIRouter(prefix="/github", tags=["github"])


def get_repository_service(session: AsyncSession = Depends(get_session)) -> RepositoryService:
    return RepositoryService(RepositoryStore(session))


@router.post("/webhooks", response_model=GitHubWebhookResponse, status_code=202)
async def github_webhook(
    request: Request,
    event: str | None = Header(default=None, alias="X-GitHub-Event"),
    signature: str | None = Header(default=None, alias="X-Hub-Signature-256"),
    settings: Settings = Depends(get_settings),
    service: RepositoryService = Depends(get_repository_service),
) -> GitHubWebhookResponse:
    """Accept verified push hooks and enqueue scans without exposing source content."""
    body = await request.body()
    service.verify_github_webhook_signature(body, signature, settings.github_webhook_secret)
    if event != "push":
        return GitHubWebhookResponse(accepted=True, event=event or "unknown", queued_scans=0)
    if not settings.redis_url:
        raise HTTPException(status_code=503, detail="Repository scans require CODEATLAS_REDIS_URL")
    try:
        payload = json.loads(body)
        full_name = payload["repository"]["full_name"]
        ref = payload["ref"]
        after = payload["after"]
    except (KeyError, TypeError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=422, detail="Invalid GitHub push payload") from error
    if not all(isinstance(value, str) for value in (full_name, ref, after)):
        raise HTTPException(status_code=422, detail="Invalid GitHub push payload")
    if after == "0" * 40:
        return GitHubWebhookResponse(accepted=True, event=event, queued_scans=0)
    scans = await service.request_webhook_scans(full_name, ref)
    for _, scan in scans:
        run_repository_scan.delay(str(scan.id))
    return GitHubWebhookResponse(accepted=True, event=event, queued_scans=len(scans))
