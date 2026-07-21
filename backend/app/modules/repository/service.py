"""Repository lifecycle service; parsing is delegated to worker infrastructure."""

from __future__ import annotations

import hashlib
import hmac
from urllib.parse import urlparse
from uuid import UUID

from fastapi import HTTPException
from pydantic import SecretStr

from app.modules.repository.models import Repository, RepositoryScan
from app.modules.repository.repository import RepositoryStore


class RepositoryService:
    def __init__(self, store: RepositoryStore) -> None:
        self._store = store

    async def connect(
        self, organization_id: UUID, url: str, branch: str, credential_owner_id: UUID | None = None
    ) -> Repository:
        full_name, clone_url = self._normalize_github_url(url)
        if await self._store.find(organization_id, full_name):
            raise HTTPException(status_code=409, detail="Repository is already connected")
        repository = await self._store.create(
            organization_id, full_name, clone_url, branch, credential_owner_id
        )
        await self._store.commit()
        return repository

    async def request_scan(
        self, repository_id: UUID, organization_id: UUID
    ) -> tuple[Repository, RepositoryScan]:
        repository = await self._store.get(repository_id, organization_id)
        if repository is None:
            raise HTTPException(status_code=404, detail="Repository was not found")
        scan = await self._store.queue_scan(repository_id)
        await self._store.commit()
        return repository, scan

    async def list(self, organization_id: UUID) -> list[Repository]:
        return await self._store.list(organization_id)

    async def request_webhook_scans(
        self, full_name: str, ref: str
    ) -> list[tuple[Repository, RepositoryScan]]:
        """Queue default-branch scans for every tenant connected to a pushed repository."""
        queued: list[tuple[Repository, RepositoryScan]] = []
        for repository in await self._store.list_by_full_name(full_name):
            if ref != f"refs/heads/{repository.default_branch}":
                continue
            queued.append((repository, await self._store.queue_scan(repository.id)))
        if queued:
            await self._store.commit()
        return queued

    @staticmethod
    def verify_github_webhook_signature(
        body: bytes, signature: str | None, secret: SecretStr | None
    ) -> None:
        """Verify GitHub's raw-body HMAC before accepting a webhook payload."""
        if secret is None:
            raise HTTPException(status_code=503, detail="GitHub webhooks are not configured")
        if not signature or not signature.startswith("sha256="):
            raise HTTPException(status_code=401, detail="GitHub webhook signature is missing")
        expected = "sha256=" + hmac.new(
            secret.get_secret_value().encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=401, detail="GitHub webhook signature is invalid")

    @staticmethod
    def _normalize_github_url(value: str) -> tuple[str, str]:
        normalized = value.strip().removesuffix("/")
        if normalized.startswith("git@github.com:"):
            path = normalized.removeprefix("git@github.com:").removesuffix(".git")
        else:
            parsed = urlparse(normalized)
            if parsed.scheme not in {"https", "http"} or parsed.hostname != "github.com":
                raise HTTPException(
                    status_code=422, detail="Only GitHub repository URLs are supported"
                )
            path = parsed.path.strip("/").removesuffix(".git")
        owner, separator, name = path.partition("/")
        if not owner or not separator or not name or "/" in name:
            raise HTTPException(status_code=422, detail="Invalid GitHub repository URL")
        return f"{owner}/{name}", f"https://github.com/{owner}/{name}.git"
