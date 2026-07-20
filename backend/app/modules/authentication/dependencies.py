"""Reusable authorization policies for downstream module controllers."""

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials

from app.modules.authentication.controller import bearer_scheme, get_authentication_service
from app.modules.authentication.models import MembershipRole
from app.modules.authentication.service import AuthenticationService


def require_role(*permitted: MembershipRole) -> Callable:
    """Create a dependency that verifies a bearer token's organization role."""

    async def authorize(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
        service: AuthenticationService = Depends(get_authentication_service),
    ) -> dict[str, str]:
        claims = service.decode_access_token(credentials.credentials)
        if MembershipRole(claims["role"]) not in permitted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient organization role"
            )
        return claims

    return authorize
