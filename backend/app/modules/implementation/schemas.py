"""Architecture-to-code API contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.implementation.models import PlanStatus


class CreatePlanRequest(BaseModel):
    change_request: str = Field(min_length=10, max_length=8000)
    graph_version_id: UUID | None = None


class OpenPullRequestRequest(BaseModel):
    title: str = Field(min_length=3, max_length=256)
    body: str = Field(min_length=3, max_length=12000)
    head_branch: str = Field(min_length=1, max_length=255)
    base_branch: str = Field(default="main", min_length=1, max_length=255)


class ImplementationPlanResponse(BaseModel):
    id: UUID
    repository_id: UUID
    graph_version_id: UUID
    requested_by: UUID
    approved_by: UUID | None
    status: PlanStatus
    change_request: str
    plan_json: dict
    pull_request_url: str | None
    error: str | None
    created_at: datetime
    approved_at: datetime | None
    completed_at: datetime | None
