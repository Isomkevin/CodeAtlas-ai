"""Graph projection, traversal, and version-diff use cases."""

import hashlib
import json
from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException

from app.modules.graph.models import ArchitectureGraphVersion, GraphEdge, GraphNode
from app.modules.graph.repository import GraphVersionRepository
from app.modules.graph.store import Neo4jGraphStore
from app.modules.repository.models import RepositoryScan, SourceFactRecord


class GraphService:
    """Owns graph projection rules; consumers never inspect source files directly."""

    def __init__(self, catalog: GraphVersionRepository, graph: Neo4jGraphStore) -> None:
        self._catalog = catalog
        self._graph = graph

    async def project_scan(
        self, repository_id: UUID, scan: RepositoryScan
    ) -> ArchitectureGraphVersion:
        facts = await self._catalog.source_facts(scan.id)
        nodes, edges = self._build_projection(repository_id, facts)
        fingerprint = self._fingerprint(nodes, edges)
        version = await self._catalog.create_version(
            repository_id,
            scan,
            fingerprint,
            {
                "node_count": len(nodes),
                "edge_count": len(edges),
                "source_fact_count": len(facts),
            },
        )
        if version.status.value == "ready":
            return version
        try:
            await self._graph.ensure_schema()
            await self._graph.write_version(version.id, repository_id, nodes, edges)
            await self._catalog.mark_ready(version)
        except Exception as error:
            await self._catalog.mark_failed(version, error)
            raise
        return version

    async def read_graph(
        self, repository_id: UUID, version_id: UUID | None = None
    ) -> tuple[ArchitectureGraphVersion, list[GraphNode], list[GraphEdge]]:
        version = (
            await self._catalog.get_version(version_id, repository_id)
            if version_id
            else await self._catalog.latest_ready(repository_id)
        )
        if version is None:
            raise HTTPException(status_code=404, detail="No architecture graph is available")
        if version.status.value != "ready":
            raise HTTPException(status_code=409, detail="Architecture graph is not ready")
        nodes, edges = await self._graph.read_version(version.id)
        return version, nodes, edges

    async def list_versions(self, repository_id: UUID) -> list[ArchitectureGraphVersion]:
        return await self._catalog.list_versions(repository_id)

    async def diff(
        self, repository_id: UUID, from_version_id: UUID, to_version_id: UUID
    ) -> tuple[list[GraphNode], list[GraphNode], list[GraphEdge], list[GraphEdge]]:
        from_version = await self._catalog.get_version(from_version_id, repository_id)
        to_version = await self._catalog.get_version(to_version_id, repository_id)
        if from_version is None or to_version is None:
            raise HTTPException(status_code=404, detail="Architecture graph version was not found")
        if from_version.status.value != "ready" or to_version.status.value != "ready":
            raise HTTPException(status_code=409, detail="Both graph versions must be ready")
        old_nodes, old_edges = await self._graph.read_version(from_version.id)
        new_nodes, new_edges = await self._graph.read_version(to_version.id)
        old_node_index = {node.id: node for node in old_nodes}
        new_node_index = {node.id: node for node in new_nodes}
        old_edge_index = {edge.id: edge for edge in old_edges}
        new_edge_index = {edge.id: edge for edge in new_edges}
        return (
            [node for node_id, node in new_node_index.items() if node_id not in old_node_index],
            [node for node_id, node in old_node_index.items() if node_id not in new_node_index],
            [edge for edge_id, edge in new_edge_index.items() if edge_id not in old_edge_index],
            [edge for edge_id, edge in old_edge_index.items() if edge_id not in new_edge_index],
        )

    @staticmethod
    def _build_projection(
        repository_id: UUID, facts: Sequence[SourceFactRecord]
    ) -> tuple[list[GraphNode], list[GraphEdge]]:
        nodes: dict[str, GraphNode] = {}
        edges: dict[str, GraphEdge] = {}
        for fact in facts:
            module_id = GraphService._id("module", fact.path)
            nodes.setdefault(
                module_id,
                GraphNode(
                    id=module_id,
                    kind="module",
                    name=fact.path,
                    repository_id=repository_id,
                    properties={"path": fact.path},
                ),
            )
            if fact.kind == "import":
                target_id = GraphService._id("external_module", fact.name)
                nodes.setdefault(
                    target_id,
                    GraphNode(
                        id=target_id,
                        kind="external_module",
                        name=fact.name,
                        repository_id=repository_id,
                        properties={"external": "true"},
                    ),
                )
                edge = GraphService._edge(module_id, target_id, "imports", repository_id)
                edges[edge.id] = edge
                continue
            node_id = GraphService._id(fact.kind, fact.path, fact.name, str(fact.line))
            nodes[node_id] = GraphNode(
                id=node_id,
                kind=fact.kind,
                name=fact.name,
                repository_id=repository_id,
                properties={"path": fact.path, "line": str(fact.line)},
            )
            edge = GraphService._edge(module_id, node_id, "contains", repository_id)
            edges[edge.id] = edge
        return list(nodes.values()), list(edges.values())

    @staticmethod
    def _id(*parts: str) -> str:
        return hashlib.sha256("\\x1f".join(parts).encode()).hexdigest()

    @staticmethod
    def _edge(source_id: str, target_id: str, kind: str, repository_id: UUID) -> GraphEdge:
        edge_id = GraphService._id("edge", source_id, target_id, kind)
        return GraphEdge(
            id=edge_id,
            source_id=source_id,
            target_id=target_id,
            kind=kind,
            repository_id=repository_id,
        )

    @staticmethod
    def _fingerprint(nodes: Sequence[GraphNode], edges: Sequence[GraphEdge]) -> str:
        payload = {
            "nodes": [
                {"id": node.id, "kind": node.kind, "name": node.name, "properties": node.properties}
                for node in sorted(nodes, key=lambda item: item.id)
            ],
            "edges": [
                {
                    "id": edge.id,
                    "source_id": edge.source_id,
                    "target_id": edge.target_id,
                    "kind": edge.kind,
                }
                for edge in sorted(edges, key=lambda item: item.id)
            ],
        }
        return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
