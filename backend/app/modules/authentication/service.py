"""Authentication module application service and public interface."""

import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx
import jwt
from cryptography.fernet import Fernet
from fastapi import HTTPException, status

from app.config import Settings
from app.modules.authentication.models import MembershipRole, Organization, User
from app.modules.authentication.repository import AuthenticationRepository
from app.modules.authentication.schemas import AccessToken, CurrentUser


class AuthenticationService:
    """Coordinates identities, memberships, signed sessions, and OAuth state."""

    def __init__(self, repository: AuthenticationRepository | None, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    def create_github_authorization_url(self) -> str:
        if not all([self._settings.github_client_id, self._settings.github_oauth_redirect_uri]):
            raise HTTPException(status_code=503, detail="GitHub OAuth is not configured")
        state = self._encode(
            {"purpose": "github_oauth", "nonce": secrets.token_urlsafe(24)}, timedelta(minutes=10)
        )
        query = urlencode(
            {
                "client_id": self._settings.github_client_id,
                "redirect_uri": str(self._settings.github_oauth_redirect_uri),
                "scope": "read:user user:email repo",
                "state": state,
            }
        )
        return f"https://github.com/login/oauth/authorize?{query}"

    def validate_oauth_state(self, state: str) -> None:
        claims = self._decode(state)
        if claims.get("purpose") != "github_oauth":
            raise HTTPException(status_code=401, detail="Invalid OAuth state")

    async def sign_in_with_github(self, code: str, state: str) -> AccessToken:
        """Exchange a verified GitHub identity for a tenant-scoped CodeAtlas session."""

        if self._repository is None:
            raise RuntimeError("GitHub sign-in requires a persistence repository")
        self.validate_oauth_state(state)
        profile, github_access_token = await self._fetch_github_profile(code)
        email = profile["email"].lower()
        user = await self._repository.find_user_by_email(email)
        if user is None:
            user = await self._repository.create_user(
                email=email,
                username=profile["login"],
                display_name=profile["name"] or profile["login"],
                avatar_url=profile["avatar_url"],
            )
            organization = await self._repository.create_organization(
                name=f"{user.display_name} workspace",
                slug=f"{user.username}-workspace",
                owner=user,
            )
            role = MembershipRole.OWNER
            await self._repository.add_audit(
                action="organization.created",
                resource_type="organization",
                organization_id=organization.id,
                actor_id=user.id,
            )
        else:
            membership_and_organization = await self._repository.find_first_membership(user.id)
            if membership_and_organization is None:
                raise HTTPException(
                    status_code=403, detail="User has no active organization membership"
                )
            membership, organization = membership_and_organization
            role = membership.role
        await self._repository.touch_login(user)
        await self._repository.upsert_github_credential(
            user.id, profile["login"], self._encrypt_github_token(github_access_token)
        )
        await self._repository.add_audit(
            action="session.created",
            resource_type="session",
            organization_id=organization.id,
            actor_id=user.id,
        )
        await self._repository.commit()
        return self.mint_access_token(user, organization, role)

    def mint_access_token(
        self, user: User, organization: Organization, role: MembershipRole
    ) -> AccessToken:
        expires_in = self._settings.access_token_ttl_minutes * 60
        token = self._encode(
            {"sub": str(user.id), "org": str(organization.id), "role": role.value},
            timedelta(seconds=expires_in),
        )
        return AccessToken(access_token=token, expires_in=expires_in)

    def current_user_from_claims(
        self, claims: dict[str, str], user: User, organization: Organization
    ) -> CurrentUser:
        return CurrentUser(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            organization_id=organization.id,
            organization_slug=organization.slug,
            role=MembershipRole(claims["role"]),
        )

    def decode_access_token(self, token: str) -> dict[str, str]:
        claims = self._decode(token)
        if not {"sub", "org", "role"}.issubset(claims):
            raise HTTPException(status_code=401, detail="Invalid access token")
        return claims

    async def _fetch_github_profile(self, code: str) -> tuple[dict[str, str], str]:
        if not all(
            [
                self._settings.github_client_id,
                self._settings.github_client_secret,
                self._settings.github_oauth_redirect_uri,
            ]
        ):
            raise HTTPException(status_code=503, detail="GitHub OAuth is not configured")
        async with httpx.AsyncClient(timeout=10.0) as client:
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": self._settings.github_client_id,
                    "client_secret": self._settings.github_client_secret.get_secret_value(),
                    "code": code,
                    "redirect_uri": str(self._settings.github_oauth_redirect_uri),
                },
            )
            if token_response.is_error:
                raise HTTPException(
                    status_code=401, detail="GitHub authorization code was rejected"
                )
            access_token = token_response.json().get("access_token")
            if not access_token:
                raise HTTPException(status_code=401, detail="GitHub did not return an access token")
            headers = {
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {access_token}",
            }
            profile_response = await client.get("https://api.github.com/user", headers=headers)
            emails_response = await client.get(
                "https://api.github.com/user/emails", headers=headers
            )
        if profile_response.is_error or emails_response.is_error:
            raise HTTPException(status_code=502, detail="GitHub profile lookup failed")
        email = next(
            (
                item["email"]
                for item in emails_response.json()
                if item.get("primary") and item.get("verified") and item.get("email")
            ),
            None,
        )
        profile = profile_response.json()
        if not email or not profile.get("login"):
            raise HTTPException(
                status_code=422, detail="A verified primary GitHub email is required"
            )
        return (
            {
                "email": email,
                "login": profile["login"],
                "name": profile.get("name") or "",
                "avatar_url": profile.get("avatar_url") or "",
            },
            access_token,
        )

    def _encrypt_github_token(self, access_token: str) -> str:
        key = self._settings.github_token_encryption_key
        if key is None:
            if self._settings.environment == "production":
                raise RuntimeError("GitHub token encryption key is not configured")
            return access_token
        return Fernet(key.get_secret_value().encode()).encrypt(access_token.encode()).decode()

    def _encode(self, claims: dict[str, str], lifetime: timedelta) -> str:
        now = datetime.now(UTC)
        payload = claims | {
            "iss": self._settings.jwt_issuer,
            "aud": self._settings.jwt_audience,
            "iat": now,
            "exp": now + lifetime,
        }
        return jwt.encode(payload, self._settings.jwt_secret.get_secret_value(), algorithm="HS256")

    def _decode(self, token: str) -> dict[str, str]:
        try:
            return jwt.decode(
                token,
                self._settings.jwt_secret.get_secret_value(),
                algorithms=["HS256"],
                issuer=self._settings.jwt_issuer,
                audience=self._settings.jwt_audience,
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
            ) from exc
