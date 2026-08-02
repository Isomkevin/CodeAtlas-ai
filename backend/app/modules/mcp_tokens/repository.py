"""Persistence layer for MCP personal access tokens."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.authentication.models import Membership, MembershipRole
from app.modules.mcp_tokens.models import MCPPersonalAccessToken


class MCPTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        *,
        organization_id: UUID,
        user_id: UUID,
        name: str,
        token_hash: str,
        prefix: str,
        expires_at: datetime | None,
    ) -> MCPPersonalAccessToken:
        token = MCPPersonalAccessToken(
            organization_id=organization_id,
            user_id=user_id,
            name=name,
            token_hash=token_hash,
            prefix=prefix,
            expires_at=expires_at,
        )
        self._session.add(token)
        await self._session.flush()
        return token

    async def list_for_user(
        self, organization_id: UUID, user_id: UUID
    ) -> list[MCPPersonalAccessToken]:
        result = await self._session.execute(
            select(MCPPersonalAccessToken)
            .where(
                MCPPersonalAccessToken.organization_id == organization_id,
                MCPPersonalAccessToken.user_id == user_id,
                MCPPersonalAccessToken.revoked_at.is_(None),
            )
            .order_by(MCPPersonalAccessToken.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(
        self, token_id: UUID, organization_id: UUID, user_id: UUID
    ) -> MCPPersonalAccessToken | None:
        return await self._session.scalar(
            select(MCPPersonalAccessToken).where(
                MCPPersonalAccessToken.id == token_id,
                MCPPersonalAccessToken.organization_id == organization_id,
                MCPPersonalAccessToken.user_id == user_id,
            )
        )

    async def revoke(self, token: MCPPersonalAccessToken) -> None:
        token.revoked_at = datetime.now(UTC)
        await self._session.flush()

    async def find_active_by_hash(self, token_hash: str) -> MCPPersonalAccessToken | None:
        now = datetime.now(UTC)
        result = await self._session.execute(
            select(MCPPersonalAccessToken).where(
                MCPPersonalAccessToken.token_hash == token_hash,
                MCPPersonalAccessToken.revoked_at.is_(None),
            )
        )
        token = result.scalar_one_or_none()
        if token is None:
            return None
        if token.expires_at is not None and token.expires_at <= now:
            return None
        return token

    async def member_role(
        self, organization_id: UUID, user_id: UUID
    ) -> MembershipRole | None:
        return await self._session.scalar(
            select(Membership.role).where(
                Membership.organization_id == organization_id,
                Membership.user_id == user_id,
            )
        )

    async def mark_used(self, token_id: UUID) -> None:
        await self._session.execute(
            update(MCPPersonalAccessToken)
            .where(MCPPersonalAccessToken.id == token_id)
            .values(last_used_at=datetime.now(UTC))
        )

    async def commit(self) -> None:
        await self._session.commit()
