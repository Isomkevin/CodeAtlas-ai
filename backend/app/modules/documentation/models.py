"""Artifact catalog models. Artifact content always references a graph version."""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ArtifactKind(StrEnum):
    DOCUMENTATION = "documentation"
    MERMAID = "mermaid"
    DRAWIO = "drawio"
    C4 = "c4"


class ArchitectureArtifact(Base):
    __tablename__ = "architecture_artifacts"
    __table_args__ = (
        UniqueConstraint("graph_version_id", "kind", "content_hash", name="uq_artifact_content"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id"), index=True)
    graph_version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("architecture_graph_versions.id"), index=True
    )
    kind: Mapped[ArtifactKind] = mapped_column(Enum(ArtifactKind, name="artifact_kind"))
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
