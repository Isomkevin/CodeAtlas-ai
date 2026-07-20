"""Authentication HTTP controllers; all business logic stays in the service."""

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.repository import AuthenticationRepository
from app.modules.authentication.schemas import AccessToken, GitHubAuthorization, GitHubCallbackQuery
from app.modules.authentication.service import AuthenticationService

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer_scheme = HTTPBearer(auto_error=True)


def get_authentication_service(
    settings: Settings = Depends(get_settings),
) -> AuthenticationService:
    """Expose token and OAuth-state operations that do not require a database query."""

    return AuthenticationService(None, settings)


def get_persistent_authentication_service(
    session: AsyncSession = Depends(get_session), settings: Settings = Depends(get_settings)
) -> AuthenticationService:
    return AuthenticationService(AuthenticationRepository(session), settings)


@router.get("/github/authorize", response_model=GitHubAuthorization, summary="Start GitHub OAuth")
async def github_authorize(
    service: AuthenticationService = Depends(get_authentication_service),
) -> GitHubAuthorization:
    return GitHubAuthorization(authorization_url=service.create_github_authorization_url())


@router.get("/github/callback", response_model=AccessToken, summary="Complete GitHub OAuth")
async def github_callback(
    query: GitHubCallbackQuery = Depends(),
    service: AuthenticationService = Depends(get_persistent_authentication_service),
) -> AccessToken:
    return await service.sign_in_with_github(query.code, query.state)


@router.get("/session/claims", summary="Validate the current bearer token")
async def session_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: AuthenticationService = Depends(get_authentication_service),
) -> dict[str, str]:
    return service.decode_access_token(credentials.credentials)
