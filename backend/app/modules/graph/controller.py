"""Read-only HTTP API for the canonical architecture graph."""

from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from neo4j import AsyncGraphDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.dependencies import require_role
from app.modules.authentication.models import MembershipRole
from app.modules.graph.repository import GraphVersionRepository
from app.modules.graph.schemas import (
    ArchitectureGraphResponse,
    GraphDiffResponse,
    GraphEdgeResponse,
    GraphNodeResponse,
    GraphVersionResponse,
)
from app.modules.graph.service import GraphService
from app.modules.graph.store import Neo4jGraphStore
from app.modules.repository.repository import RepositoryStore

router = APIRouter(prefix="/repositories/{repository_id}/graph", tags=["architecture-graph"])


async def get_graph_store(
    settings: Settings = Depends(get_settings),
) -> AsyncIterator[Neo4jGraphStore]:
    if not settings.neo4j_uri:
        raise HTTPException(status_code=503, detail="Architecture graph storage is not configured")
    driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_username, settings.neo4j_password.get_secret_value()),
    )
    try:
        yield Neo4jGraphStore(driver)
    finally:
        await driver.close()


def get_graph_service(
    session: AsyncSession = Depends(get_session), graph: Neo4jGraphStore = Depends(get_graph_store)
) -> GraphService:
    return GraphService(GraphVersionRepository(session), graph)


async def require_repository_access(
    repository_id: UUID,
    claims: dict[str, str] = Depends(require_role(*list(MembershipRole))),
    session: AsyncSession = Depends(get_session),
) -> UUID:
    repository = await RepositoryStore(session).get(repository_id, UUID(claims["org"]))
    if repository is None:
        raise HTTPException(status_code=404, detail="Repository was not found")
    return repository_id


@router.get("", response_model=ArchitectureGraphResponse)
async def read_architecture_graph(
    repository_id: UUID = Depends(require_repository_access),
    version_id: UUID | None = None,
    service: GraphService = Depends(get_graph_service),
) -> ArchitectureGraphResponse:
    version, nodes, edges = await service.read_graph(repository_id, version_id)
    return ArchitectureGraphResponse(
        version_id=version.id,
        repository_id=repository_id,
        nodes=[
            GraphNodeResponse(
                id=node.id, kind=node.kind, name=node.name, properties=node.properties
            )
            for node in nodes
        ],
        edges=[
            GraphEdgeResponse(
                id=edge.id, source_id=edge.source_id, target_id=edge.target_id, kind=edge.kind
            )
            for edge in edges
        ],
    )


@router.get("/versions", response_model=list[GraphVersionResponse])
async def list_graph_versions(
    repository_id: UUID = Depends(require_repository_access),
    service: GraphService = Depends(get_graph_service),
) -> list[GraphVersionResponse]:
    versions = await service.list_versions(repository_id)
    return [
        GraphVersionResponse.model_validate(version, from_attributes=True) for version in versions
    ]


@router.get("/diff", response_model=GraphDiffResponse)
async def diff_architecture_graph(
    from_version_id: UUID,
    to_version_id: UUID,
    repository_id: UUID = Depends(require_repository_access),
    service: GraphService = Depends(get_graph_service),
) -> GraphDiffResponse:
    added_nodes, removed_nodes, added_edges, removed_edges = await service.diff(
        repository_id, from_version_id, to_version_id
    )
    return GraphDiffResponse(
        from_version_id=from_version_id,
        to_version_id=to_version_id,
        added_nodes=[
            GraphNodeResponse(
                id=node.id, kind=node.kind, name=node.name, properties=node.properties
            )
            for node in added_nodes
        ],
        removed_nodes=[
            GraphNodeResponse(
                id=node.id, kind=node.kind, name=node.name, properties=node.properties
            )
            for node in removed_nodes
        ],
        added_edges=[
            GraphEdgeResponse(
                id=edge.id, source_id=edge.source_id, target_id=edge.target_id, kind=edge.kind
            )
            for edge in added_edges
        ],
        removed_edges=[
            GraphEdgeResponse(
                id=edge.id, source_id=edge.source_id, target_id=edge.target_id, kind=edge.kind
            )
            for edge in removed_edges
        ],
    )
