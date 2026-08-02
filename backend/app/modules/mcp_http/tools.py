"""CodeAtlas MCP tools resolved against internal services (no self-HTTP)."""

from dataclasses import dataclass
from uuid import UUID

from fastapi import HTTPException

from app.modules.authentication.models import MembershipRole
from app.modules.graph.service import GraphService
from app.modules.implementation.service import ImplementationService
from app.modules.repository.repository import RepositoryStore

TOOLS = [
    {
        "name": "get_architecture_graph",
        "description": "Read the canonical architecture graph for a connected repository.",
        "inputSchema": {
            "type": "object",
            "properties": {"repository_id": {"type": "string"}},
            "required": ["repository_id"],
        },
    },
    {
        "name": "create_implementation_plan",
        "description": (
            "Create a graph-bound implementation plan. Approval is required before PR creation."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "repository_id": {"type": "string"},
                "change_request": {"type": "string"},
                "graph_version_id": {"type": "string"},
            },
            "required": ["repository_id", "change_request"],
        },
    },
]


@dataclass
class ToolContext:
    """Bundles per-request services + claims so tool implementations stay pure."""

    claims: dict[str, str]
    graph_service: GraphService
    implementation_service: ImplementationService
    repositories: RepositoryStore


async def _authorized_repository_id(context: ToolContext, repository_id_raw: str) -> UUID:
    try:
        repository_id = UUID(repository_id_raw)
    except (TypeError, ValueError) as error:
        raise ValueError("repository_id must be a UUID") from error
    repository = await context.repositories.get(repository_id, UUID(context.claims["org"]))
    if repository is None:
        raise RuntimeError("Repository was not found or is not accessible by this workspace")
    return repository_id


async def call_tool(name: str, arguments: dict, context: ToolContext) -> dict:
    if not isinstance(arguments, dict):
        raise ValueError("arguments must be an object")
    repository_id_raw = arguments.get("repository_id")
    if not isinstance(repository_id_raw, str) or not repository_id_raw:
        raise ValueError("repository_id is required")
    repository_id = await _authorized_repository_id(context, repository_id_raw)

    if name == "get_architecture_graph":
        version_id_raw = arguments.get("graph_version_id")
        version_id = UUID(version_id_raw) if isinstance(version_id_raw, str) and version_id_raw else None
        try:
            version, nodes, edges = await context.graph_service.read_graph(
                repository_id, version_id
            )
        except HTTPException as error:
            raise RuntimeError(str(error.detail)) from error
        return {
            "version_id": str(version.id),
            "repository_id": str(repository_id),
            "nodes": [
                {"id": node.id, "kind": node.kind, "name": node.name, "properties": node.properties}
                for node in nodes
            ],
            "edges": [
                {
                    "id": edge.id,
                    "source_id": edge.source_id,
                    "target_id": edge.target_id,
                    "kind": edge.kind,
                }
                for edge in edges
            ],
        }

    if name == "create_implementation_plan":
        change_request = arguments.get("change_request")
        if not isinstance(change_request, str) or len(change_request.strip()) < 10:
            raise ValueError("change_request must be at least 10 characters")
        # Enforce the same policy as the REST endpoint: any workspace member can create
        # a draft plan; only owner/admin can approve it later.
        if MembershipRole(context.claims["role"]) not in list(MembershipRole):
            raise RuntimeError("Insufficient workspace role")
        version_id_raw = arguments.get("graph_version_id")
        version_id = UUID(version_id_raw) if isinstance(version_id_raw, str) and version_id_raw else None
        try:
            plan = await context.implementation_service.create_plan(
                repository_id,
                UUID(context.claims["sub"]),
                change_request,
                version_id,
            )
        except HTTPException as error:
            raise RuntimeError(str(error.detail)) from error
        return {
            "id": str(plan.id),
            "repository_id": str(plan.repository_id),
            "graph_version_id": str(plan.graph_version_id),
            "status": plan.status.value if hasattr(plan.status, "value") else plan.status,
            "change_request": plan.change_request,
            "plan_json": plan.plan_json,
            "pull_request_url": plan.pull_request_url,
            "error": plan.error,
            "created_at": plan.created_at.isoformat() if plan.created_at else None,
        }

    raise ValueError(f"Unknown tool: {name}")
