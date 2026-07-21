"""Graph-derived artifact use cases."""

import hashlib
from uuid import UUID

from app.modules.documentation.models import ArchitectureArtifact, ArtifactKind
from app.modules.documentation.renderers import render_artifact
from app.modules.documentation.repository import ArtifactRepository
from app.modules.graph.service import GraphService


class ArtifactService:
    def __init__(self, artifacts: ArtifactRepository, graph: GraphService) -> None:
        self._artifacts = artifacts
        self._graph = graph

    async def generate(
        self, repository_id: UUID, kind: ArtifactKind, version_id: UUID | None = None
    ) -> ArchitectureArtifact:
        version, nodes, edges = await self._graph.read_graph(repository_id, version_id)
        content = render_artifact(kind, nodes, edges)
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        existing = await self._artifacts.find(version.id, kind, content_hash)
        if existing is not None:
            return existing
        artifact = await self._artifacts.create(
            repository_id,
            version.id,
            kind,
            content_hash,
            content,
            {"node_count": len(nodes), "edge_count": len(edges)},
        )
        await self._artifacts.commit()
        return artifact

    async def list(self, repository_id: UUID) -> list[ArchitectureArtifact]:
        return await self._artifacts.list(repository_id)

    async def get(self, artifact_id: UUID, repository_id: UUID) -> ArchitectureArtifact | None:
        return await self._artifacts.get(artifact_id, repository_id)
