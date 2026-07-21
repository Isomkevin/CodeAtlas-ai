"""Tests for the development-only demo session guard."""

import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.config import Settings
from app.modules.authentication.models import Membership, MembershipRole
from app.modules.authentication.service import AuthenticationService
from app.modules.documentation.models import ArchitectureArtifact
from app.modules.graph.models import ArchitectureGraphVersion
from app.modules.implementation.models import ImplementationPlan
from app.modules.repository.models import RepositoryScan


def test_development_session_creates_owner_and_mints_token() -> None:
    created: dict[str, object] = {}
    user = SimpleNamespace(id=uuid4(), display_name="CodeAtlas Demo")
    organization = SimpleNamespace(id=uuid4())

    class Repository:
        async def find_user_by_email(self, email: str):
            assert email == "demo@codeatlas.local"
            return None

        async def create_user(self, **values):
            created["user"] = values
            return user

        async def create_organization(self, **values):
            created["organization"] = values
            return organization

        async def add_audit(self, **values):
            created["audit"] = values

        async def touch_login(self, _):
            return None

        async def commit(self):
            return None

    service = AuthenticationService(Repository(), Settings(environment="development"))
    token = asyncio.run(service.create_development_session())

    assert token.access_token
    assert created["organization"] == {
        "name": "CodeAtlas Demo Workspace", "slug": "codeatlas-demo", "owner": user
    }


def test_development_session_requires_a_membership_for_existing_user() -> None:
    class Repository:
        async def find_user_by_email(self, _):
            return SimpleNamespace(id=uuid4())

        async def find_first_membership(self, _):
            return None

    with pytest.raises(HTTPException) as error:
        service = AuthenticationService(Repository(), Settings(environment="development"))
        asyncio.run(service.create_development_session())

    assert error.value.status_code == 403


def test_persisted_enums_match_the_lowercase_postgres_values() -> None:
    assert Membership.__table__.c.role.type.enums == ["owner", "admin", "member", "viewer"]
    assert RepositoryScan.__table__.c.status.type.enums == [
        "queued",
        "running",
        "completed",
        "failed",
    ]
    assert ArchitectureGraphVersion.__table__.c.status.type.enums == [
        "projecting",
        "ready",
        "failed",
    ]
    assert ArchitectureArtifact.__table__.c.kind.type.enums == [
        "documentation",
        "mermaid",
        "drawio",
        "c4",
    ]
    assert ImplementationPlan.__table__.c.status.type.enums == [
        "draft",
        "approved",
        "pull_request_opened",
        "failed",
    ]


def test_session_claims_allows_jwt_timestamp_fields(client) -> None:
    token = AuthenticationService(None, Settings(environment="test")).mint_access_token(
        SimpleNamespace(id=uuid4()),
        SimpleNamespace(id=uuid4()),
        MembershipRole.OWNER,
    )

    response = client.get(
        "/api/v1/auth/session/claims",
        headers={"Authorization": f"Bearer {token.access_token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "owner"
    assert isinstance(response.json()["iat"], int)
