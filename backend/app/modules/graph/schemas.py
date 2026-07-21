"""HTTP and worker-facing contracts for canonical architecture graphs."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.graph.models import GraphVersionStatus


class GraphNodeResponse(BaseModel):
    id: str
    kind: str
    name: str
    properties: dict[str, str] = Field(default_factory=dict)


class GraphEdgeResponse(BaseModel):
    id: str
    source_id: str
    target_id: str
    kind: str


class ArchitectureGraphResponse(BaseModel):
    version_id: UUID
    repository_id: UUID
    nodes: list[GraphNodeResponse]
    edges: list[GraphEdgeResponse]


class GraphVersionResponse(BaseModel):
    id: UUID
    repository_id: UUID
    scan_id: UUID
    sequence: int
    parent_version_id: UUID | None
    commit_sha: str
    fingerprint: str
    status: GraphVersionStatus
    summary: dict
    error: str | None
    created_at: datetime
    completed_at: datetime | None


class GraphDiffResponse(BaseModel):
    from_version_id: UUID
    to_version_id: UUID
    added_nodes: list[GraphNodeResponse]
    removed_nodes: list[GraphNodeResponse]
    added_edges: list[GraphEdgeResponse]
    removed_edges: list[GraphEdgeResponse]
