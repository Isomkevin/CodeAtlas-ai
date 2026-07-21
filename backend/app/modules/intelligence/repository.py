"""Drift persistence adapter."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.intelligence.models import ArchitectureDrift


class IntelligenceRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find(
        self, graph_version_id: UUID, source_id: str, target_id: str, kind: str
    ) -> ArchitectureDrift | None:
        return await self._session.scalar(
            select(ArchitectureDrift).where(
                ArchitectureDrift.graph_version_id == graph_version_id,
                ArchitectureDrift.source_node_id == source_id,
                ArchitectureDrift.target_node_id == target_id,
                ArchitectureDrift.kind == kind,
            )
        )

    async def create(
        self,
        repository_id: UUID,
        graph_version_id: UUID,
        source_id: str,
        target_id: str,
        kind: str,
        severity: str,
        message: str,
    ) -> ArchitectureDrift:
        drift = ArchitectureDrift(
            repository_id=repository_id,
            graph_version_id=graph_version_id,
            source_node_id=source_id,
            target_node_id=target_id,
            kind=kind,
            severity=severity,
            message=message,
        )
        self._session.add(drift)
        await self._session.flush()
        return drift

    async def list(self, repository_id: UUID) -> list[ArchitectureDrift]:
        return list(
            (
                await self._session.scalars(
                    select(ArchitectureDrift)
                    .where(ArchitectureDrift.repository_id == repository_id)
                    .order_by(ArchitectureDrift.created_at.desc())
                )
            ).all()
        )

    async def commit(self) -> None:
        await self._session.commit()
