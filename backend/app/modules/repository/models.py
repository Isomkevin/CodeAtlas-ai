"""Repository and scan persistence models."""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ScanStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Repository(Base):
    __tablename__ = "repositories"
    __table_args__ = (
        UniqueConstraint("organization_id", "full_name", name="uq_repository_org_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    credential_owner_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    provider: Mapped[str] = mapped_column(String(24), nullable=False, default="github")
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    clone_url: Mapped[str] = mapped_column(Text, nullable=False)
    default_branch: Mapped[str] = mapped_column(String(255), nullable=False, default="main")
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active")
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class RepositoryScan(Base):
    __tablename__ = "repository_scans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id"), index=True)
    status: Mapped[ScanStatus] = mapped_column(
        Enum(
            ScanStatus,
            name="scan_status",
            values_callable=lambda enum: [member.value for member in enum],
        ),
        default=ScanStatus.QUEUED,
    )
    commit_sha: Mapped[str | None] = mapped_column(String(64))
    summary: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SourceFactRecord(Base):
    __tablename__ = "source_facts"
    __table_args__ = (
        UniqueConstraint("scan_id", "path", "kind", "name", "line", name="uq_source_fact"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repository_scans.id"), index=True)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    line: Mapped[int] = mapped_column(nullable=False)
