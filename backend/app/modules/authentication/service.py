"""Authentication module application service and public interface."""

import secrets
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import jwt
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
