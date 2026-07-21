"""Persistence adapter owned exclusively by the authentication module."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.authentication.models import (
    AuditLog,
    GitHubCredential,
    Membership,
    MembershipRole,
    Organization,
    User,
)


class AuthenticationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_user_by_email(self, email: str) -> User | None:
        return await self._session.scalar(
            select(User).where(User.email == email, User.deleted_at.is_(None))
        )

    async def find_membership(self, user_id: UUID, organization_id: UUID) -> Membership | None:
        return await self._session.scalar(
            select(Membership).where(
                Membership.user_id == user_id, Membership.organization_id == organization_id
            )
        )

    async def find_first_membership(self, user_id: UUID) -> tuple[Membership, Organization] | None:
        row = await self._session.execute(
            select(Membership, Organization)
            .join(Organization, Organization.id == Membership.organization_id)
            .where(Membership.user_id == user_id, Organization.deleted_at.is_(None))
            .order_by(Membership.created_at)
            .limit(1)
        )
        return row.first()

    async def commit(self) -> None:
        await self._session.commit()

    async def create_user(
        self, email: str, username: str, display_name: str, avatar_url: str | None
    ) -> User:
        user = User(
            email=email, username=username, display_name=display_name, avatar_url=avatar_url
        )
        self._session.add(user)
        await self._session.flush()
        return user

    async def create_organization(self, name: str, slug: str, owner: User) -> Organization:
        organization = Organization(name=name, slug=slug)
        self._session.add(organization)
        await self._session.flush()
        self._session.add(
            Membership(organization_id=organization.id, user_id=owner.id, role=MembershipRole.OWNER)
        )
        await self._session.flush()
        return organization

    async def touch_login(self, user: User) -> None:
        user.last_login = datetime.now(UTC)
        await self._session.flush()

    async def add_audit(
        self, action: str, resource_type: str, organization_id: UUID | None, actor_id: UUID | None
    ) -> None:
        self._session.add(
            AuditLog(
                action=action,
                resource_type=resource_type,
                organization_id=organization_id,
                actor_id=actor_id,
            )
        )
        await self._session.flush()

    async def upsert_github_credential(
        self, user_id: UUID, github_login: str, encrypted_access_token: str
    ) -> None:
        credential = await self._session.scalar(
            select(GitHubCredential).where(GitHubCredential.user_id == user_id)
        )
        if credential is None:
            credential = GitHubCredential(
                user_id=user_id,
                github_login=github_login,
                encrypted_access_token=encrypted_access_token,
            )
            self._session.add(credential)
        else:
            credential.github_login = github_login
            credential.encrypted_access_token = encrypted_access_token
        await self._session.flush()
