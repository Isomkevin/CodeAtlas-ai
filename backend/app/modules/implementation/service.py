"""Create and execute graph-bound implementation plans behind explicit approvals."""

import re
from uuid import UUID

from fastapi import HTTPException

from app.config import Settings
from app.modules.authentication.github_credentials import GitHubCredentialService
from app.modules.graph.service import GraphService
from app.modules.implementation.github import GitHubPullRequestClient
from app.modules.implementation.models import ImplementationPlan, PlanStatus
from app.modules.implementation.repository import ImplementationPlanRepository
from app.modules.repository.models import Repository


class ImplementationService:
    def __init__(
        self,
        plans: ImplementationPlanRepository,
        graph: GraphService,
        credentials: GitHubCredentialService,
        pull_requests: GitHubPullRequestClient,
        settings: Settings,
    ) -> None:
        self._plans = plans
        self._graph = graph
        self._credentials = credentials
        self._pull_requests = pull_requests
        self._settings = settings

    async def create_plan(
        self,
        repository_id: UUID,
        requested_by: UUID,
        change_request: str,
        version_id: UUID | None,
    ) -> ImplementationPlan:
        version, nodes, edges = await self._graph.read_graph(repository_id, version_id)
        keywords = set(re.findall(r"[a-zA-Z0-9_./-]{3,}", change_request.lower()))
        relevant = [
            node
            for node in nodes
            if any(
                word in f"{node.name} {node.properties.get('path', '')}".lower()
                for word in keywords
            )
        ]
        selected = relevant[:12] or nodes[:8]
        selected_ids = {node.id for node in selected}
        related_edges = [
            edge
            for edge in edges
            if edge.source_id in selected_ids or edge.target_id in selected_ids
        ]
        tasks = [
            {
                "id": f"task-{index}",
                "title": f"Implement the requested change in {node.name}",
                "node_id": node.id,
                "path": node.properties.get("path"),
                "acceptance_criteria": [
                    "Preserve graph relationships or intentionally update them.",
                    "Add focused automated tests for the changed behavior.",
                ],
            }
            for index, node in enumerate(selected, start=1)
        ]
        plan = {
            "graph_version_id": str(version.id),
            "summary": change_request,
            "affected_node_ids": sorted(selected_ids),
            "affected_edge_ids": sorted(edge.id for edge in related_edges),
            "tasks": tasks,
            "guardrails": [
                "An owner or administrator must approve before a pull request can be opened.",
                "The coding agent must use this graph version as context and report graph drift "
                "after changes.",
            ],
        }
        item = await self._plans.create(
            repository_id, version.id, requested_by, change_request, plan
        )
        await self._plans.commit()
        return item

    async def approve(self, plan: ImplementationPlan, approved_by: UUID) -> ImplementationPlan:
        if plan.status != PlanStatus.DRAFT:
            raise HTTPException(
                status_code=409, detail="Only draft implementation plans can be approved"
            )
        await self._plans.approve(plan, approved_by)
        await self._plans.commit()
        return plan

    async def open_pull_request(
        self,
        plan: ImplementationPlan,
        repository: Repository,
        title: str,
        body: str,
        head_branch: str,
        base_branch: str,
    ) -> ImplementationPlan:
        if plan.status != PlanStatus.APPROVED:
            raise HTTPException(status_code=409, detail="Implementation plan requires approval")
        if repository.credential_owner_id is None:
            raise HTTPException(status_code=409, detail="Repository has no GitHub credential owner")
        try:
            token = await self._credentials.access_token_for(repository.credential_owner_id)
            created = await self._pull_requests.create_pull_request(
                token, repository.full_name, title, body, head_branch, base_branch
            )
            await self._plans.complete_pull_request(plan, created.url)
            await self._plans.commit()
        except Exception as error:
            await self._plans.fail(plan, error)
            await self._plans.commit()
            raise
        return plan

    async def get(self, plan_id: UUID, repository_id: UUID) -> ImplementationPlan | None:
        return await self._plans.get(plan_id, repository_id)

    async def list(self, repository_id: UUID) -> list[ImplementationPlan]:
        return await self._plans.list(repository_id)
