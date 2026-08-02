"""Authentication HTTP controllers; all business logic stays in the service."""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.bearer import bearer_scheme, resolve_bearer_claims
from app.modules.authentication.repository import AuthenticationRepository
from app.modules.authentication.models import MembershipRole
from app.modules.authentication.schemas import (
    AccessToken,
    GitHubAuthorization,
    GitHubCallbackQuery,
    WorkspaceResponse,
    WorkspaceUpdateRequest,
)
from app.modules.authentication.service import AuthenticationService

router = APIRouter(prefix="/auth", tags=["authentication"])


def require_workspace_role(*permitted: MembershipRole):
    """Authorize workspace settings without importing the downstream dependency module."""

    async def authorize(
        claims: dict[str, str] = Depends(resolve_bearer_claims),
    ) -> dict[str, str]:
        if MembershipRole(claims["role"]) not in permitted:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient organization role")
        return claims

    return authorize


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
    claims: dict[str, str] = Depends(resolve_bearer_claims),
) -> dict[str, str | int]:
    return claims


def _workspace_response(organization, role: str) -> WorkspaceResponse:
    return WorkspaceResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        plan=organization.plan,
        status=organization.status,
        role=MembershipRole(role),
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


@router.get("/workspace", response_model=WorkspaceResponse)
async def get_workspace(
    claims: dict[str, str] = Depends(require_workspace_role(*list(MembershipRole))),
    service: AuthenticationService = Depends(get_persistent_authentication_service),
) -> WorkspaceResponse:
    organization = await service.get_workspace(UUID(claims["org"]))
    return _workspace_response(organization, claims["role"])


@router.put("/workspace", response_model=WorkspaceResponse)
async def update_workspace(
    request: WorkspaceUpdateRequest,
    claims: dict[str, str] = Depends(require_workspace_role(MembershipRole.OWNER, MembershipRole.ADMIN)),
    service: AuthenticationService = Depends(get_persistent_authentication_service),
) -> WorkspaceResponse:
    organization = await service.update_workspace(
        UUID(claims["org"]), UUID(claims["sub"]), request.name, request.slug
    )
    return _workspace_response(organization, claims["role"])
