"""HTTP endpoints for graph-only architecture intelligence."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.modules.graph.controller import get_graph_service, require_repository_access
from app.modules.graph.service import GraphService
from app.modules.intelligence.repository import IntelligenceRepository
from app.modules.intelligence.schemas import (
    ChatRequest,
    ChatResponse,
    DriftResponse,
    ImpactResponse,
)
from app.modules.intelligence.service import ArchitectureIntelligenceService

router = APIRouter(prefix="/repositories/{repository_id}", tags=["architecture-intelligence"])


def get_intelligence_service(
    session: AsyncSession = Depends(get_session),
    graph: GraphService = Depends(get_graph_service),
    settings: Settings = Depends(get_settings),
) -> ArchitectureIntelligenceService:
    return ArchitectureIntelligenceService(graph, IntelligenceRepository(session), settings)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_architecture(
    request: ChatRequest,
    repository_id: UUID = Depends(require_repository_access),
    service: ArchitectureIntelligenceService = Depends(get_intelligence_service),
) -> ChatResponse:
    answer, mode, version_id, citations = await service.chat(
        repository_id, request.question, request.graph_version_id
    )
    return ChatResponse(answer=answer, mode=mode, graph_version_id=version_id, citations=citations)


@router.get("/impact/{node_id}", response_model=ImpactResponse)
async def analyze_impact(
    node_id: str,
    max_depth: int = Query(default=2, ge=1, le=5),
    graph_version_id: UUID | None = None,
    repository_id: UUID = Depends(require_repository_access),
    service: ArchitectureIntelligenceService = Depends(get_intelligence_service),
) -> ImpactResponse:
    try:
        version_id, node_ids, edge_ids = await service.impact(
            repository_id, node_id, max_depth, graph_version_id
        )
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return ImpactResponse(graph_version_id=version_id, node_ids=node_ids, edge_ids=edge_ids)


@router.post("/drift", response_model=list[DriftResponse])
async def detect_drift(
    repository_id: UUID = Depends(require_repository_access),
    service: ArchitectureIntelligenceService = Depends(get_intelligence_service),
) -> list[DriftResponse]:
    drifts = await service.detect_drift(repository_id)
    return [DriftResponse.model_validate(item, from_attributes=True) for item in drifts]


@router.get("/drift", response_model=list[DriftResponse])
async def list_drift(
    repository_id: UUID = Depends(require_repository_access),
    service: ArchitectureIntelligenceService = Depends(get_intelligence_service),
) -> list[DriftResponse]:
    return [
        DriftResponse.model_validate(item, from_attributes=True)
        for item in await service.list_drifts(repository_id)
    ]
