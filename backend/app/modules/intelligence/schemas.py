"""Architecture-intelligence API contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=4000)
    graph_version_id: UUID | None = None


class ChatResponse(BaseModel):
    answer: str
    mode: str
    graph_version_id: UUID
    citations: list[str]


class ImpactResponse(BaseModel):
    graph_version_id: UUID
    node_ids: list[str]
    edge_ids: list[str]


class DriftResponse(BaseModel):
    id: UUID
    graph_version_id: UUID
    source_node_id: str
    target_node_id: str
    kind: str
    severity: str
    message: str
    created_at: datetime
