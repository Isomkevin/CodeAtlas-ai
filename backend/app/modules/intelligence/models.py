"""Persistent architecture drift observations."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ArchitectureDrift(Base):
    __tablename__ = "architecture_drifts"
    __table_args__ = (
        UniqueConstraint(
            "graph_version_id", "source_node_id", "target_node_id", "kind", name="uq_graph_drift"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id"), index=True)
    graph_version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("architecture_graph_versions.id"), index=True
    )
    source_node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    target_node_id: Mapped[str] = mapped_column(String(64), nullable=False)
    kind: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
