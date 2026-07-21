"""Artifact API contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.modules.documentation.models import ArtifactKind


class GenerateArtifactRequest(BaseModel):
    kind: ArtifactKind
    graph_version_id: UUID | None = None


class ArtifactResponse(BaseModel):
    id: UUID
    repository_id: UUID
    graph_version_id: UUID
    kind: ArtifactKind
    content_hash: str
    content: str
    metadata_json: dict
    created_at: datetime
