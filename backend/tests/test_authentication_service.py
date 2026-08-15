import asyncio
from datetime import timedelta
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.config import Settings
from app.modules.authentication.models import MembershipRole
from app.modules.authentication.service import AuthenticationService


def service() -> AuthenticationService:
    return AuthenticationService(
        SimpleNamespace(), Settings(environment="test", allowed_origins=[])
    )


def test_access_token_round_trip() -> None:
    user = SimpleNamespace(id=uuid4())
    organization = SimpleNamespace(id=uuid4())
    token = service().mint_access_token(user, organization, MembershipRole.ADMIN)

    assert service().decode_access_token(token.access_token)["role"] == "admin"


def test_invalid_access_token_is_rejected() -> None:
    with pytest.raises(HTTPException) as error:
        service().decode_access_token("not-a-token")

    assert error.value.status_code == 401


def test_github_oauth_requires_configuration() -> None:
    with pytest.raises(HTTPException) as error:
        service().create_github_authorization_url()

    assert error.value.status_code == 503


def test_github_sign_in_provisions_owner_workspace() -> None:
    user = SimpleNamespace(
        id=uuid4(),
        email="engineer@example.com",
        username="engineer",
        display_name="Engineer",
    )
    organization = SimpleNamespace(id=uuid4(), slug="engineer-workspace")

    class Repository:
        audit_actions: list[str] = []
        committed = False

        async def find_user_by_email(self, email: str):
            assert email == "engineer@example.com"
            return None

        async def create_user(self, **_):
            return user

        async def create_organization(self, **_):
            return organization

        async def add_audit(self, action: str, **_):
            self.audit_actions.append(action)

        async def touch_login(self, _):
            return None

        async def upsert_github_credential(self, *_):
            return None

        async def commit(self):
            self.committed = True

    repository = Repository()
    auth_service = AuthenticationService(
        repository, Settings(environment="test", allowed_origins=[])
    )

    async def profile(_: str) -> tuple[dict[str, str], str]:
        return (
            {
                "email": "engineer@example.com",
                "login": "engineer",
                "name": "Engineer",
                "avatar_url": "https://example.com/avatar.png",
            },
            "github-token",
        )

    auth_service._fetch_github_profile = profile  # type: ignore[method-assign]
    state = auth_service._encode({"purpose": "github_oauth", "nonce": "test"}, timedelta(minutes=1))
    access_token = asyncio.run(auth_service.sign_in_with_github("code", state))

    assert auth_service.decode_access_token(access_token.access_token)["role"] == "owner"
    assert repository.audit_actions == ["organization.created", "session.created"]
    assert repository.committed is True


def test_workspace_update_persists_identity_and_records_an_audit_event() -> None:
    organization = SimpleNamespace(id=uuid4(), name="Acme", slug="acme")
    actor_id = uuid4()

    class Repository:
        audit: dict[str, object] | None = None
        committed = False

        async def get_organization(self, organization_id):
            assert organization_id == organization.id
            return organization

        async def find_organization_by_slug(self, slug):
            assert slug == "acme-engineering"
            return None

        async def update_organization(self, current, name, slug):
            current.name = name
            current.slug = slug
            return current

        async def add_audit(self, **values):
            self.audit = values

        async def commit(self):
            self.committed = True

    repository = Repository()
    updated = asyncio.run(
        AuthenticationService(repository, Settings(environment="test")).update_workspace(
            organization.id, actor_id, "Acme Engineering", "acme-engineering"
        )
    )

    assert (updated.name, updated.slug) == ("Acme Engineering", "acme-engineering")
    assert repository.audit == {
        "action": "workspace.updated",
        "resource_type": "organization",
        "organization_id": organization.id,
        "actor_id": actor_id,
    }
    assert repository.committed is True


def test_workspace_update_rejects_a_slug_owned_by_another_workspace() -> None:
    organization = SimpleNamespace(id=uuid4(), name="Acme", slug="acme")

    class Repository:
        async def get_organization(self, _):
            return organization

        async def find_organization_by_slug(self, _):
            return SimpleNamespace(id=uuid4())

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            AuthenticationService(Repository(), Settings(environment="test")).update_workspace(
                organization.id, uuid4(), "Acme", "taken"
            )
        )

    assert error.value.status_code == 409
