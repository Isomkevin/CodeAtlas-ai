"""Graph-only reasoning, impact analysis, and architecture drift detection."""

from collections import deque
from uuid import UUID

import httpx

from app.config import Settings
from app.modules.graph.models import GraphEdge, GraphNode
from app.modules.graph.service import GraphService
from app.modules.intelligence.models import ArchitectureDrift
from app.modules.intelligence.repository import IntelligenceRepository


class ArchitectureIntelligenceService:
    def __init__(
        self,
        graph: GraphService,
        drifts: IntelligenceRepository,
        settings: Settings,
    ) -> None:
        self._graph = graph
        self._drifts = drifts
        self._settings = settings

    async def chat(
        self, repository_id: UUID, question: str, version_id: UUID | None = None
    ) -> tuple[str, str, UUID, list[str]]:
        version, nodes, edges = await self._graph.read_graph(repository_id, version_id)
        citations = self._matching_nodes(question, nodes)
        context = self._context(nodes, edges, citations)
        answer = self._deterministic_answer(question, nodes, edges, citations)
        if self._settings.ai_api_key is not None:
            answer = await self._enhance_with_model(question, context, answer)
            mode = "model_graph_context"
        else:
            mode = "deterministic_graph"
        return answer, mode, version.id, [node.id for node in citations]

    async def impact(
        self, repository_id: UUID, node_id: str, max_depth: int, version_id: UUID | None
    ) -> tuple[UUID, list[str], list[str]]:
        version, nodes, edges = await self._graph.read_graph(repository_id, version_id)
        if node_id not in {node.id for node in nodes}:
            raise ValueError("Architecture node was not found")
        adjacent: dict[str, list[tuple[str, GraphEdge]]] = {}
        for edge in edges:
            adjacent.setdefault(edge.source_id, []).append((edge.target_id, edge))
            adjacent.setdefault(edge.target_id, []).append((edge.source_id, edge))
        visited = {node_id}
        edge_ids: set[str] = set()
        queue: deque[tuple[str, int]] = deque([(node_id, 0)])
        while queue:
            current, depth = queue.popleft()
            if depth >= max_depth:
                continue
            for target, edge in adjacent.get(current, []):
                edge_ids.add(edge.id)
                if target not in visited:
                    visited.add(target)
                    queue.append((target, depth + 1))
        return version.id, sorted(visited), sorted(edge_ids)

    async def detect_drift(self, repository_id: UUID) -> list[ArchitectureDrift]:
        versions = await self._graph.list_versions(repository_id)
        current = next((item for item in versions if item.status.value == "ready"), None)
        if current is None or current.parent_version_id is None:
            return []
        added_nodes, _, added_edges, _ = await self._graph.diff(
            repository_id, current.parent_version_id, current.id
        )
        node_names = {node.id: node.name for node in added_nodes}
        observations: list[ArchitectureDrift] = []
        for edge in added_edges:
            severity = "medium" if edge.kind == "imports" else "low"
            source = node_names.get(edge.source_id, edge.source_id)
            target = node_names.get(edge.target_id, edge.target_id)
            message = f"New {edge.kind} relationship: {source} -> {target}"
            existing = await self._drifts.find(
                current.id, edge.source_id, edge.target_id, edge.kind
            )
            if existing is None:
                existing = await self._drifts.create(
                    repository_id,
                    current.id,
                    edge.source_id,
                    edge.target_id,
                    edge.kind,
                    severity,
                    message,
                )
            observations.append(existing)
        await self._drifts.commit()
        return observations

    async def list_drifts(self, repository_id: UUID) -> list[ArchitectureDrift]:
        return await self._drifts.list(repository_id)

    @staticmethod
    def _matching_nodes(question: str, nodes: list[GraphNode]) -> list[GraphNode]:
        words = {
            word.lower()
            for word in question.replace("/", " ").replace("-", " ").split()
            if len(word) > 2
        }
        matches = [
            node
            for node in nodes
            if any(
                word in f"{node.name} {node.properties.get('path', '')}".lower() for word in words
            )
        ]
        return matches[:8] or nodes[:8]

    @staticmethod
    def _context(nodes: list[GraphNode], edges: list[GraphEdge], citations: list[GraphNode]) -> str:
        node_index = {node.id: node for node in nodes}
        cited_ids = {node.id for node in citations}
        lines = ["Architecture graph context:"]
        for node in citations:
            lines.append(f"- {node.id}: {node.kind} {node.name}")
        for edge in edges:
            if edge.source_id in cited_ids or edge.target_id in cited_ids:
                source = node_index[edge.source_id].name
                target = node_index[edge.target_id].name
                lines.append(f"- {source} {edge.kind} {target}")
        return "\n".join(lines)

    @staticmethod
    def _deterministic_answer(
        question: str, nodes: list[GraphNode], edges: list[GraphEdge], citations: list[GraphNode]
    ) -> str:
        node_index = {node.id: node for node in nodes}
        if not citations:
            return (
                "The selected architecture graph has no components yet. "
                "Run a repository scan first."
            )
        cited_ids = {node.id for node in citations}
        relations = [
            f"{node_index[edge.source_id].name} {edge.kind} {node_index[edge.target_id].name}"
            for edge in edges
            if edge.source_id in cited_ids or edge.target_id in cited_ids
        ]
        components = ", ".join(f"{node.kind} `{node.name}`" for node in citations)
        relation_text = "; ".join(relations[:12]) or "no direct relationships in this graph version"
        return (
            f"For '{question}', the graph matches {components}. "
            f"Direct relationships: {relation_text}."
        )

    async def _enhance_with_model(self, question: str, context: str, fallback: str) -> str:
        headers = {"Authorization": f"Bearer {self._settings.ai_api_key.get_secret_value()}"}
        payload = {
            "model": self._settings.ai_model,
            "instructions": (
                "Answer only from the supplied architecture graph context. "
                "Never infer or request repository source files. "
                "Cite component names in the answer."
            ),
            "input": f"Question: {question}\n\n{context}\n\nDraft answer: {fallback}",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{str(self._settings.ai_base_url).rstrip('/')}/responses",
                headers=headers,
                json=payload,
            )
        response.raise_for_status()
        output = response.json().get("output_text")
        return output if isinstance(output, str) and output.strip() else fallback
