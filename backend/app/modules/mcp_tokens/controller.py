"""HTTP endpoints for MCP personal access tokens.

These endpoints refuse PAT authentication on purpose: a compromised PAT must
not be able to mint further PATs. Only session JWTs (the browser sign-in
path) can manage tokens.
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.bearer import bearer_scheme
from app.modules.authentication.service import AuthenticationService
from app.modules.mcp_tokens.repository import MCPTokenRepository
from app.modules.mcp_tokens.schemas import (
    CreatedPersonalAccessToken,
    CreatePersonalAccessTokenRequest,
    PersonalAccessTokenSummary,
)
from app.modules.mcp_tokens.service import (
    PAT_PREFIX,
    hash_token,
    mint_raw_token,
    visible_prefix,
)

router = APIRouter(prefix="/mcp/tokens", tags=["mcp"])


async def require_jwt_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    """Reject PATs; only accept session JWTs so PAT management stays firewalled."""

    token = credentials.credentials
    if token.startswith(PAT_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Personal access tokens cannot manage tokens; sign in via GitHub.",
        )
    return AuthenticationService(None, settings).decode_access_token(token)


def _summary(token) -> PersonalAccessTokenSummary:
    return PersonalAccessTokenSummary(
        id=token.id,
        name=token.name,
        prefix=token.prefix,
        created_at=token.created_at,
        expires_at=token.expires_at,
        last_used_at=token.last_used_at,
    )


@router.get("", response_model=list[PersonalAccessTokenSummary])
async def list_tokens(
    claims: dict[str, str] = Depends(require_jwt_claims),
    session: AsyncSession = Depends(get_session),
) -> list[PersonalAccessTokenSummary]:
    repo = MCPTokenRepository(session)
    tokens = await repo.list_for_user(UUID(claims["org"]), UUID(claims["sub"]))
    return [_summary(token) for token in tokens]


@router.post("", response_model=CreatedPersonalAccessToken, status_code=201)
async def create_token(
    request: CreatePersonalAccessTokenRequest,
    claims: dict[str, str] = Depends(require_jwt_claims),
    session: AsyncSession = Depends(get_session),
) -> CreatedPersonalAccessToken:
    expires_at = (
        datetime.now(UTC) + timedelta(days=request.expires_in_days)
        if request.expires_in_days is not None
        else None
    )
    raw = mint_raw_token()
    repo = MCPTokenRepository(session)
    token = await repo.create(
        organization_id=UUID(claims["org"]),
        user_id=UUID(claims["sub"]),
        name=request.name,
        token_hash=hash_token(raw),
        prefix=visible_prefix(raw),
        expires_at=expires_at,
    )
    await repo.commit()
    return CreatedPersonalAccessToken(
        id=token.id,
        name=token.name,
        prefix=token.prefix,
        token=raw,
        created_at=token.created_at,
        expires_at=token.expires_at,
    )


@router.delete("/{token_id}", status_code=204)
async def revoke_token(
    token_id: UUID,
    claims: dict[str, str] = Depends(require_jwt_claims),
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = MCPTokenRepository(session)
    token = await repo.get(token_id, UUID(claims["org"]), UUID(claims["sub"]))
    if token is None or token.revoked_at is not None:
        raise HTTPException(status_code=404, detail="Personal access token was not found")
    await repo.revoke(token)
    await repo.commit()
