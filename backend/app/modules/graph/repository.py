"""PostgreSQL catalog and source-fact access for graph projection."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.graph.models import ArchitectureGraphVersion, GraphVersionStatus
from app.modules.repository.models import RepositoryScan, SourceFactRecord


class GraphVersionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def source_facts(self, scan_id: UUID) -> list[SourceFactRecord]:
        return list(
            (
                await self._session.scalars(
                    select(SourceFactRecord)
                    .where(SourceFactRecord.scan_id == scan_id)
                    .order_by(
                        SourceFactRecord.path,
                        SourceFactRecord.line,
                        SourceFactRecord.kind,
                        SourceFactRecord.name,
                    )
                )
            ).all()
        )

    async def get_version(
        self, version_id: UUID, repository_id: UUID
    ) -> ArchitectureGraphVersion | None:
        return await self._session.scalar(
            select(ArchitectureGraphVersion).where(
                ArchitectureGraphVersion.id == version_id,
                ArchitectureGraphVersion.repository_id == repository_id,
            )
        )

    async def version_for_scan(self, scan_id: UUID) -> ArchitectureGraphVersion | None:
        return await self._session.scalar(
            select(ArchitectureGraphVersion).where(ArchitectureGraphVersion.scan_id == scan_id)
        )

    async def latest_ready(self, repository_id: UUID) -> ArchitectureGraphVersion | None:
        return await self._session.scalar(
            select(ArchitectureGraphVersion)
            .where(
                ArchitectureGraphVersion.repository_id == repository_id,
                ArchitectureGraphVersion.status == GraphVersionStatus.READY,
            )
            .order_by(ArchitectureGraphVersion.sequence.desc())
            .limit(1)
        )

    async def list_versions(self, repository_id: UUID) -> list[ArchitectureGraphVersion]:
        return list(
            (
                await self._session.scalars(
                    select(ArchitectureGraphVersion)
                    .where(ArchitectureGraphVersion.repository_id == repository_id)
                    .order_by(ArchitectureGraphVersion.sequence.desc())
                )
            ).all()
        )

    async def create_version(
        self, repository_id: UUID, scan: RepositoryScan, fingerprint: str, summary: dict
    ) -> ArchitectureGraphVersion:
        existing = await self.version_for_scan(scan.id)
        if existing is not None:
            return existing
        latest = await self.latest_ready(repository_id)
        sequence = (latest.sequence if latest else 0) + 1
        version = ArchitectureGraphVersion(
            repository_id=repository_id,
            scan_id=scan.id,
            sequence=sequence,
            parent_version_id=latest.id if latest else None,
            commit_sha=scan.commit_sha or "unknown",
            fingerprint=fingerprint,
            summary=summary,
        )
        self._session.add(version)
        await self._session.flush()
        return version

    async def mark_ready(self, version: ArchitectureGraphVersion) -> None:
        version.status = GraphVersionStatus.READY
        version.completed_at = datetime.now(UTC)
        await self._session.flush()

    async def mark_failed(self, version: ArchitectureGraphVersion, error: Exception) -> None:
        version.status = GraphVersionStatus.FAILED
        version.error = str(error)[:4000]
        version.completed_at = datetime.now(UTC)
        await self._session.flush()
