"""Authentication API contracts; ORM entities never leave the module."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator

from app.modules.authentication.models import MembershipRole


class CurrentUser(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str
    organization_id: UUID
    organization_slug: str
    role: MembershipRole


class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class GitHubAuthorization(BaseModel):
    authorization_url: HttpUrl


class GitHubCallbackQuery(BaseModel):
    code: str = Field(min_length=1, max_length=2048)
    state: str = Field(min_length=1, max_length=4096)


class CreateOrganizationRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=80)

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: object) -> object:
        """Keep organization slugs URL-safe even when GitHub login casing varies."""

        return value.strip().lower() if isinstance(value, str) else value


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    plan: str
    status: str
    role: MembershipRole
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkspaceUpdateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$", min_length=2, max_length=80)

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: object) -> object:
        """Accept legacy mixed-case slugs and persist their canonical lowercase form."""

        return value.strip().lower() if isinstance(value, str) else value
