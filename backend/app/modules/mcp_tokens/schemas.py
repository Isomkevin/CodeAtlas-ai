"""MCP personal access token API contracts."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CreatePersonalAccessTokenRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    expires_in_days: int | None = Field(default=None, ge=1, le=365)


class PersonalAccessTokenSummary(BaseModel):
    id: UUID
    name: str
    prefix: str
    created_at: datetime
    expires_at: datetime | None
    last_used_at: datetime | None


class CreatedPersonalAccessToken(BaseModel):
    id: UUID
    name: str
    prefix: str
    token: str
    created_at: datetime
    expires_at: datetime | None
