"""Authentication HTTP controllers; all business logic stays in the service."""

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings
from app.modules.authentication.schemas import GitHubAuthorization
from app.modules.authentication.service import AuthenticationService

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer_scheme = HTTPBearer(auto_error=True)


def get_authentication_service(
    settings: Settings = Depends(get_settings),
) -> AuthenticationService:
    """Expose token and OAuth-state operations that do not require a database query."""

    return AuthenticationService(None, settings)


@router.get("/github/authorize", response_model=GitHubAuthorization, summary="Start GitHub OAuth")
async def github_authorize(
    service: AuthenticationService = Depends(get_authentication_service),
) -> GitHubAuthorization:
    return GitHubAuthorization(authorization_url=service.create_github_authorization_url())


@router.get("/session/claims", summary="Validate the current bearer token")
async def session_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: AuthenticationService = Depends(get_authentication_service),
) -> dict[str, str]:
    return service.decode_access_token(credentials.credentials)
