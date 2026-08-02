"""Bearer token resolution that accepts both session JWTs and MCP PATs.

The MCP coding bridge requires a long-lived credential that survives browser
sign-out; the browser UI uses a short-lived JWT. Both land on the API in the
same `Authorization: Bearer <token>` shape, so every protected route resolves
credentials through this single dependency.
"""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import create_session_factory
from app.modules.authentication.service import AuthenticationService
from app.modules.mcp_tokens.repository import MCPTokenRepository
from app.modules.mcp_tokens.service import PAT_PREFIX, hash_token

bearer_scheme = HTTPBearer(auto_error=True)


async def _resolve_pat_claims(token: str, session: AsyncSession) -> dict[str, str]:
    repo = MCPTokenRepository(session)
    pat = await repo.find_active_by_hash(hash_token(token))
    if pat is None:
        raise HTTPException(status_code=401, detail="Personal access token is invalid or revoked")
    role = await repo.member_role(pat.organization_id, pat.user_id)
    if role is None:
        raise HTTPException(
            status_code=401,
            detail="Personal access token owner has no active workspace membership",
        )
    await repo.mark_used(pat.id)
    await repo.commit()
    return {
        "sub": str(pat.user_id),
        "org": str(pat.organization_id),
        "role": role.value,
    }


async def resolve_bearer_from_token(
    token: str,
    session: AsyncSession,
    settings: Settings,
) -> dict[str, str]:
    """Resolve a bearer credential when the caller already owns a session (e.g. websockets)."""

    if token.startswith(PAT_PREFIX):
        return await _resolve_pat_claims(token, session)
    return AuthenticationService(None, settings).decode_access_token(token)


async def resolve_bearer_claims(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    """FastAPI dependency: touch the DB only when the token is actually a PAT.

    A plain session JWT decodes without any DB round-trip, so endpoints that
    never need persistence (like /auth/session/claims) continue to work in
    environments without a configured `CODEATLAS_DATABASE_URL`.
    """

    token = credentials.credentials
    if not token.startswith(PAT_PREFIX):
        return AuthenticationService(None, settings).decode_access_token(token)
    if not settings.database_url:
        raise HTTPException(
            status_code=401,
            detail="Personal access tokens require a configured database",
        )
    factory = create_session_factory(settings.database_url)
    async with factory() as session:
        return await _resolve_pat_claims(token, session)
