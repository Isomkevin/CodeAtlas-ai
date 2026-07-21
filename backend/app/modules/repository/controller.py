"""Repository HTTP controllers."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.authentication.dependencies import require_role
from app.modules.authentication.github_credentials import GitHubCredentialService
from app.modules.authentication.models import MembershipRole
from app.modules.authentication.repository import AuthenticationRepository
from app.modules.repository.github import GitHubRepositoryClient
from app.modules.repository.repository import RepositoryStore
from app.modules.repository.schemas import (
    CreateRepositoryRequest,
    DiscoverableRepository,
    RepositoryResponse,
    ScanResponse,
)
from app.modules.repository.service import RepositoryService
from app.worker import run_repository_scan

router = APIRouter(prefix="/repositories", tags=["repositories"])


def get_repository_service(session: AsyncSession = Depends(get_session)) -> RepositoryService:
    return RepositoryService(RepositoryStore(session))


async def get_github_client(
    session: AsyncSession = Depends(get_session), settings: Settings = Depends(get_settings)
) -> GitHubRepositoryClient:
    return GitHubRepositoryClient()


@router.post("", response_model=RepositoryResponse, status_code=201)
async def connect_repository(
    request: CreateRepositoryRequest,
    claims: dict[str, str] = Depends(
        require_role(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER)
    ),
    service: RepositoryService = Depends(get_repository_service),
) -> RepositoryResponse:
    repository = await service.connect(UUID(claims["org"]), request.url, request.default_branch)
    return RepositoryResponse.model_validate(repository, from_attributes=True)


@router.get("/discover", response_model=list[DiscoverableRepository])
async def discover_repositories(
    claims: dict[str, str] = Depends(require_role(*list(MembershipRole))),
    session: AsyncSession = Depends(get_session),
    settings: Settings = Depends(get_settings),
) -> list[DiscoverableRepository]:
    credential_service = GitHubCredentialService(AuthenticationRepository(session), settings)
    token = await credential_service.access_token_for(UUID(claims["sub"]))
    repositories = await GitHubRepositoryClient().list_repositories(token)
    return [DiscoverableRepository.model_validate(repository) for repository in repositories]


@router.get("", response_model=list[RepositoryResponse])
async def list_repositories(
    claims: dict[str, str] = Depends(require_role(*list(MembershipRole))),
    service: RepositoryService = Depends(get_repository_service),
) -> list[RepositoryResponse]:
    repositories = await service.list(UUID(claims["org"]))
    return [
        RepositoryResponse.model_validate(repository, from_attributes=True)
        for repository in repositories
    ]


@router.post("/{repository_id}/scan", response_model=ScanResponse, status_code=202)
async def request_scan(
    repository_id: UUID,
    _: dict[str, str] = Depends(
        require_role(MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER)
    ),
    service: RepositoryService = Depends(get_repository_service),
    settings: Settings = Depends(get_settings),
) -> ScanResponse:
    repository, scan = await service.request_scan(repository_id, UUID(_["org"]))
    if not settings.redis_url:
        raise RuntimeError("Repository scans require CODEATLAS_REDIS_URL")
    run_repository_scan.delay(str(scan.id), repository.clone_url, repository.default_branch)
    return ScanResponse.model_validate(scan, from_attributes=True)
