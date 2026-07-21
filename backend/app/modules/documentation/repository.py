"""PostgreSQL artifact catalog adapter."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.documentation.models import ArchitectureArtifact, ArtifactKind


class ArtifactRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find(
        self, graph_version_id: UUID, kind: ArtifactKind, content_hash: str
    ) -> ArchitectureArtifact | None:
        return await self._session.scalar(
            select(ArchitectureArtifact).where(
                ArchitectureArtifact.graph_version_id == graph_version_id,
                ArchitectureArtifact.kind == kind,
                ArchitectureArtifact.content_hash == content_hash,
            )
        )

    async def create(
        self,
        repository_id: UUID,
        graph_version_id: UUID,
        kind: ArtifactKind,
        content_hash: str,
        content: str,
        metadata: dict,
    ) -> ArchitectureArtifact:
        artifact = ArchitectureArtifact(
            repository_id=repository_id,
            graph_version_id=graph_version_id,
            kind=kind,
            content_hash=content_hash,
            content=content,
            metadata_json=metadata,
        )
        self._session.add(artifact)
        await self._session.flush()
        return artifact

    async def list(self, repository_id: UUID) -> list[ArchitectureArtifact]:
        return list(
            (
                await self._session.scalars(
                    select(ArchitectureArtifact)
                    .where(ArchitectureArtifact.repository_id == repository_id)
                    .order_by(ArchitectureArtifact.created_at.desc())
                )
            ).all()
        )

    async def get(self, artifact_id: UUID, repository_id: UUID) -> ArchitectureArtifact | None:
        return await self._session.scalar(
            select(ArchitectureArtifact).where(
                ArchitectureArtifact.id == artifact_id,
                ArchitectureArtifact.repository_id == repository_id,
            )
        )

    async def commit(self) -> None:
        await self._session.commit()
