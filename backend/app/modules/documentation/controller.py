"""HTTP API for immutable graph-derived artifacts."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.modules.documentation.repository import ArtifactRepository
from app.modules.documentation.schemas import ArtifactResponse, GenerateArtifactRequest
from app.modules.documentation.service import ArtifactService
from app.modules.graph.controller import get_graph_service, require_repository_access
from app.modules.graph.service import GraphService

router = APIRouter(prefix="/repositories/{repository_id}/artifacts", tags=["artifacts"])


def get_artifact_service(
    session: AsyncSession = Depends(get_session), graph: GraphService = Depends(get_graph_service)
) -> ArtifactService:
    return ArtifactService(ArtifactRepository(session), graph)


@router.post("", response_model=ArtifactResponse, status_code=201)
async def generate_artifact(
    request: GenerateArtifactRequest,
    repository_id: UUID = Depends(require_repository_access),
    service: ArtifactService = Depends(get_artifact_service),
) -> ArtifactResponse:
    artifact = await service.generate(repository_id, request.kind, request.graph_version_id)
    return ArtifactResponse.model_validate(artifact, from_attributes=True)


@router.get("", response_model=list[ArtifactResponse])
async def list_artifacts(
    repository_id: UUID = Depends(require_repository_access),
    service: ArtifactService = Depends(get_artifact_service),
) -> list[ArtifactResponse]:
    artifacts = await service.list(repository_id)
    return [ArtifactResponse.model_validate(item, from_attributes=True) for item in artifacts]


@router.get("/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(
    artifact_id: UUID,
    repository_id: UUID = Depends(require_repository_access),
    service: ArtifactService = Depends(get_artifact_service),
) -> ArtifactResponse:
    artifact = await service.get(artifact_id, repository_id)
    if artifact is None:
        raise HTTPException(status_code=404, detail="Artifact was not found")
    return ArtifactResponse.model_validate(artifact, from_attributes=True)
