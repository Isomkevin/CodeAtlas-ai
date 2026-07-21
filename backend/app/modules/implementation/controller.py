"""Approval-gated architecture-to-code HTTP workflow."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.dependencies import require_role
from app.modules.authentication.github_credentials import GitHubCredentialService
from app.modules.authentication.models import MembershipRole
from app.modules.authentication.repository import AuthenticationRepository
from app.modules.graph.controller import get_graph_service, require_repository_access
from app.modules.graph.service import GraphService
from app.modules.implementation.github import GitHubPullRequestClient
from app.modules.implementation.repository import ImplementationPlanRepository
from app.modules.implementation.schemas import (
    CreatePlanRequest,
    ImplementationPlanResponse,
    OpenPullRequestRequest,
)
from app.modules.implementation.service import ImplementationService
from app.modules.repository.repository import RepositoryStore

router = APIRouter(
    prefix="/repositories/{repository_id}/implementation-plans", tags=["implementation"]
)


def get_implementation_service(
    session: AsyncSession = Depends(get_session),
    graph: GraphService = Depends(get_graph_service),
    settings: Settings = Depends(get_settings),
) -> ImplementationService:
    return ImplementationService(
        ImplementationPlanRepository(session),
        graph,
        GitHubCredentialService(AuthenticationRepository(session), settings),
        GitHubPullRequestClient(),
        settings,
    )


@router.post("", response_model=ImplementationPlanResponse, status_code=201)
async def create_plan(
    request: CreatePlanRequest,
    repository_id: UUID = Depends(require_repository_access),
    claims: dict[str, str] = Depends(require_role(*list(MembershipRole))),
    service: ImplementationService = Depends(get_implementation_service),
) -> ImplementationPlanResponse:
    plan = await service.create_plan(
        repository_id,
        UUID(claims["sub"]),
        request.change_request,
        request.graph_version_id,
    )
    return ImplementationPlanResponse.model_validate(plan, from_attributes=True)


@router.get("", response_model=list[ImplementationPlanResponse])
async def list_plans(
    repository_id: UUID = Depends(require_repository_access),
    service: ImplementationService = Depends(get_implementation_service),
) -> list[ImplementationPlanResponse]:
    plans = await service.list(repository_id)
    return [ImplementationPlanResponse.model_validate(plan, from_attributes=True) for plan in plans]


@router.get("/{plan_id}", response_model=ImplementationPlanResponse)
async def get_plan(
    plan_id: UUID,
    repository_id: UUID = Depends(require_repository_access),
    service: ImplementationService = Depends(get_implementation_service),
) -> ImplementationPlanResponse:
    plan = await service.get(plan_id, repository_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Implementation plan was not found")
    return ImplementationPlanResponse.model_validate(plan, from_attributes=True)


@router.post("/{plan_id}/approve", response_model=ImplementationPlanResponse)
async def approve_plan(
    plan_id: UUID,
    repository_id: UUID = Depends(require_repository_access),
    claims: dict[str, str] = Depends(require_role(MembershipRole.OWNER, MembershipRole.ADMIN)),
    service: ImplementationService = Depends(get_implementation_service),
) -> ImplementationPlanResponse:
    plan = await service.get(plan_id, repository_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Implementation plan was not found")
    return ImplementationPlanResponse.model_validate(
        await service.approve(plan, UUID(claims["sub"])), from_attributes=True
    )


@router.post("/{plan_id}/pull-request", response_model=ImplementationPlanResponse)
async def open_pull_request(
    plan_id: UUID,
    request: OpenPullRequestRequest,
    repository_id: UUID = Depends(require_repository_access),
    _: dict[str, str] = Depends(require_role(MembershipRole.OWNER, MembershipRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
    service: ImplementationService = Depends(get_implementation_service),
) -> ImplementationPlanResponse:
    plan = await service.get(plan_id, repository_id)
    repository = await RepositoryStore(session).get(repository_id, UUID(_["org"]))
    if plan is None or repository is None:
        raise HTTPException(
            status_code=404, detail="Implementation plan or repository was not found"
        )
    plan = await service.open_pull_request(
        plan,
        repository,
        request.title,
        request.body,
        request.head_branch,
        request.base_branch,
    )
    return ImplementationPlanResponse.model_validate(plan, from_attributes=True)
