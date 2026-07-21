"""Repository module HTTP contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.modules.repository.models import ScanStatus


class CreateRepositoryRequest(BaseModel):
    url: str = Field(min_length=12, max_length=2048)
    default_branch: str = Field(default="main", min_length=1, max_length=255)


class DiscoverableRepository(BaseModel):
    full_name: str
    clone_url: str
    default_branch: str
    private: bool


class RepositoryResponse(BaseModel):
    id: UUID
    full_name: str
    default_branch: str
    status: str


class ScanResponse(BaseModel):
    id: UUID
    repository_id: UUID
    status: ScanStatus
    created_at: datetime
    completed_at: datetime | None
    summary: dict
    error: str | None
