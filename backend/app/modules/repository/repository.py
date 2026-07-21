"""Persistence adapter owned by the repository module."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.repository.models import Repository, RepositoryScan, ScanStatus


class RepositoryStore:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find(self, organization_id: UUID, full_name: str) -> Repository | None:
        return await self._session.scalar(
            select(Repository).where(
                Repository.organization_id == organization_id, Repository.full_name == full_name
            )
        )

    async def create(
        self,
        organization_id: UUID,
        full_name: str,
        clone_url: str,
        branch: str,
        credential_owner_id: UUID | None,
    ) -> Repository:
        repository = Repository(
            organization_id=organization_id,
            full_name=full_name,
            clone_url=clone_url,
            default_branch=branch,
            credential_owner_id=credential_owner_id,
        )
        self._session.add(repository)
        await self._session.flush()
        return repository

    async def list(self, organization_id: UUID) -> list[Repository]:
        return list(
            (
                await self._session.scalars(
                    select(Repository).where(Repository.organization_id == organization_id)
                )
            ).all()
        )

    async def list_by_full_name(self, full_name: str) -> list[Repository]:
        """Return active tenant connections for a GitHub repository webhook."""
        return list(
            (
                await self._session.scalars(
                    select(Repository).where(
                        Repository.full_name == full_name,
                        Repository.status == "active",
                    )
                )
            ).all()
        )

    async def get(self, repository_id: UUID, organization_id: UUID) -> Repository | None:
        return await self._session.scalar(
            select(Repository).where(
                Repository.id == repository_id, Repository.organization_id == organization_id
            )
        )

    async def queue_scan(self, repository_id: UUID) -> RepositoryScan:
        scan = RepositoryScan(repository_id=repository_id, status=ScanStatus.QUEUED)
        self._session.add(scan)
        await self._session.flush()
        return scan

    async def get_scan(self, scan_id: UUID, organization_id: UUID) -> RepositoryScan | None:
        return await self._session.scalar(
            select(RepositoryScan)
            .join(Repository, Repository.id == RepositoryScan.repository_id)
            .where(RepositoryScan.id == scan_id, Repository.organization_id == organization_id)
        )

    async def finish_scan(self, scan_id: UUID, commit_sha: str, summary: dict) -> None:
        scan = await self._session.get(RepositoryScan, scan_id)
        if scan is None:
            return
        scan.status = ScanStatus.COMPLETED
        scan.commit_sha = commit_sha
        scan.summary = summary
        scan.completed_at = datetime.now(UTC)
        await self._session.flush()

    async def commit(self) -> None:
        await self._session.commit()
