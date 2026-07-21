"""Architecture graph domain and operational persistence models."""

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GraphVersionStatus(StrEnum):
    """Lifecycle state for an immutable graph projection."""

    PROJECTING = "projecting"
    READY = "ready"
    FAILED = "failed"


class ArchitectureGraphVersion(Base):
    """PostgreSQL catalog entry for an immutable Neo4j graph version."""

    __tablename__ = "architecture_graph_versions"
    __table_args__ = (UniqueConstraint("scan_id", name="uq_graph_version_scan"),)

    id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id"), index=True)
    scan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repository_scans.id"), index=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    parent_version_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("architecture_graph_versions.id"), nullable=True
    )
    commit_sha: Mapped[str] = mapped_column(String(64), nullable=False)
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[GraphVersionStatus] = mapped_column(
        Enum(
            GraphVersionStatus,
            name="graph_version_status",
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=GraphVersionStatus.PROJECTING,
    )
    summary: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


@dataclass(frozen=True)
class GraphNode:
    id: str
    kind: str
    name: str
    repository_id: UUID
    properties: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class GraphEdge:
    id: str
    source_id: str
    target_id: str
    kind: str
    repository_id: UUID
