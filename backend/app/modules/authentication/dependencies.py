"""Reusable authorization policies for downstream module controllers."""

from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.modules.authentication.bearer import resolve_bearer_claims
from app.modules.authentication.models import MembershipRole


def require_role(*permitted: MembershipRole) -> Callable:
    """Create a dependency that verifies a bearer token's organization role."""

    async def authorize(claims: dict[str, str] = Depends(resolve_bearer_claims)) -> dict[str, str]:
        if MembershipRole(claims["role"]) not in permitted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient organization role"
            )
        return claims

    return authorize
