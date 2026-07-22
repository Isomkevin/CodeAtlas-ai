"""Architecture-intelligence API contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import AnyHttpUrl, BaseModel, Field, SecretStr


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


class WorkspaceAIProviderUpdate(BaseModel):
    """A key supplied by the workspace; it is encrypted and never returned."""

    api_key: SecretStr = Field(min_length=8, max_length=512)
    base_url: AnyHttpUrl = "https://api.openai.com/v1"
    model: str = Field(default="gpt-4.1-mini", min_length=1, max_length=160)


class WorkspaceAIProviderResponse(BaseModel):
    configured: bool
    source: str
    provider: str | None = None
    base_url: str | None = None
    model: str | None = None
    key_hint: str | None = None
    updated_at: datetime | None = None
