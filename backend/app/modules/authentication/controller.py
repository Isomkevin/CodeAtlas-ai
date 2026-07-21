"""Authentication HTTP controllers; all business logic stays in the service."""

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
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


@router.get(
    "/github/callback",
    response_class=HTMLResponse,
    summary="Complete GitHub OAuth",
)
async def github_callback(
    query: GitHubCallbackQuery = Depends(),
    service: AuthenticationService = Depends(get_persistent_authentication_service),
) -> HTMLResponse:
    """Return a JWT to the trusted browser opener without exposing it in a URL."""

    access_token = await service.sign_in_with_github(query.code, query.state)
    origin = str(service._settings.web_app_origin).rstrip("/")
    payload = json.dumps({"type": "codeatlas:session", "accessToken": access_token.access_token})
    document = (
        "<!doctype html><title>CodeAtlas sign-in complete</title>"
        "<script>"
        f"window.opener?.postMessage({payload}, {json.dumps(origin)});"
        "window.close();"
        "</script><p>Sign-in complete. You can close this window.</p>"
    )
    return HTMLResponse(document, headers={"Cache-Control": "no-store"})


@router.post("/development/session", response_model=AccessToken, include_in_schema=False)
async def development_session(
    settings: Settings = Depends(get_settings),
    service: AuthenticationService = Depends(get_persistent_authentication_service),
) -> AccessToken:
    """Issue a local demo session only when deliberately enabled in development."""
    if settings.environment != "development" or not settings.allow_development_login:
        raise HTTPException(status_code=404, detail="Not found")
    return await service.create_development_session()


@router.get("/session/claims", summary="Validate the current bearer token")
async def session_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    service: AuthenticationService = Depends(get_authentication_service),
) -> dict[str, str | int]:
    return service.decode_access_token(credentials.credentials)
