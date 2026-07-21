"""Persistent, approval-gated implementation plans."""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PlanStatus(StrEnum):
    DRAFT = "draft"
    APPROVED = "approved"
    PULL_REQUEST_OPENED = "pull_request_opened"
    FAILED = "failed"


class ImplementationPlan(Base):
    __tablename__ = "implementation_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("repositories.id"), index=True)
    graph_version_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("architecture_graph_versions.id"), index=True
    )
    requested_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus, name="implementation_plan_status"), default=PlanStatus.DRAFT
    )
    change_request: Mapped[str] = mapped_column(Text, nullable=False)
    plan_json: Mapped[dict] = mapped_column("plan", JSONB, nullable=False, default=dict)
    pull_request_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
