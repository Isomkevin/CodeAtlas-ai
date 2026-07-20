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
