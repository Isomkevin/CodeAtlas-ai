"""Neo4j persistence adapter for immutable architecture graph versions."""

from collections.abc import Sequence
from uuid import UUID

from neo4j import AsyncDriver

from app.modules.graph.models import GraphEdge, GraphNode
from app.modules.graph.retry import with_wake_retry


class Neo4jGraphStore:
    """Read and write architecture graph projections without Cypher leaking into services."""

    def __init__(self, driver: AsyncDriver) -> None:
        self._driver = driver

    async def ensure_schema(self) -> None:
        async def _op() -> None:
            async with self._driver.session() as session:
                result = await session.run(
                    "CREATE CONSTRAINT architecture_node_identity IF NOT EXISTS "
                    "FOR (node:ArchitectureNode) REQUIRE (node.version_id, node.id) IS UNIQUE"
                )
                await result.consume()

        await with_wake_retry(_op, label="ensure_schema")

    async def write_version(
        self,
        version_id: UUID,
        repository_id: UUID,
        nodes: Sequence[GraphNode],
        edges: Sequence[GraphEdge],
    ) -> None:
        version = str(version_id)
        repository = str(repository_id)
        node_rows = [
            {
                "id": node.id,
                "kind": node.kind,
                "name": node.name,
                "properties": node.properties,
            }
            for node in nodes
        ]
        edge_rows = [
            {
                "id": edge.id,
                "source_id": edge.source_id,
                "target_id": edge.target_id,
                "kind": edge.kind,
            }
            for edge in edges
        ]

        async def _op() -> None:
            async with self._driver.session() as session:
                if node_rows:
                    result = await session.run(
                        "UNWIND $nodes AS node "
                        "MERGE (target:ArchitectureNode {version_id: $version_id, id: node.id}) "
                        "SET target.repository_id = $repository_id, target.kind = node.kind, "
                        "target.name = node.name "
                        "SET target += node.properties",
                        nodes=node_rows,
                        version_id=version,
                        repository_id=repository,
                    )
                    await result.consume()
                if edge_rows:
                    result = await session.run(
                        "UNWIND $edges AS edge "
                        "MATCH (source:ArchitectureNode "
                        "{version_id: $version_id, id: edge.source_id}) "
                        "MATCH (target:ArchitectureNode "
                        "{version_id: $version_id, id: edge.target_id}) "
                        "MERGE (source)-[relationship:RELATES_TO "
                        "{version_id: $version_id, id: edge.id}]->(target) "
                        "SET relationship.kind = edge.kind, "
                        "relationship.repository_id = $repository_id",
                        edges=edge_rows,
                        version_id=version,
                        repository_id=repository,
                    )
                    await result.consume()

        await with_wake_retry(_op, label="write_version")

    async def read_version(self, version_id: UUID) -> tuple[list[GraphNode], list[GraphEdge]]:
        version = str(version_id)

        async def _op() -> tuple[list, list]:
            async with self._driver.session() as session:
                node_result = await session.run(
                    "MATCH (node:ArchitectureNode {version_id: $version_id}) "
                    "RETURN node.id AS id, node.kind AS kind, node.name AS name, "
                    "node.repository_id AS repository_id, properties(node) AS properties "
                    "ORDER BY node.kind, node.name, node.id",
                    version_id=version,
                )
                node_records_local = [record async for record in node_result]
                edge_result = await session.run(
                    "MATCH (source:ArchitectureNode {version_id: $version_id})"
                    "-[relationship:RELATES_TO {version_id: $version_id}]->"
                    "(target:ArchitectureNode {version_id: $version_id}) "
                    "RETURN relationship.id AS id, source.id AS source_id, "
                    "target.id AS target_id, "
                    "relationship.kind AS kind, "
                    "relationship.repository_id AS repository_id "
                    "ORDER BY relationship.kind, relationship.id",
                    version_id=version,
                )
                edge_records_local = [record async for record in edge_result]
                return node_records_local, edge_records_local

        node_records, edge_records = await with_wake_retry(_op, label="read_version")
        return (
            [
                GraphNode(
                    id=record["id"],
                    kind=record["kind"],
                    name=record["name"],
                    repository_id=UUID(record["repository_id"]),
                    properties={
                        key: str(value)
                        for key, value in dict(record["properties"] or {}).items()
                        if key not in {"id", "version_id", "repository_id", "kind", "name"}
                    },
                )
                for record in node_records
            ],
            [
                GraphEdge(
                    id=record["id"],
                    source_id=record["source_id"],
                    target_id=record["target_id"],
                    kind=record["kind"],
                    repository_id=UUID(record["repository_id"]),
                )
                for record in edge_records
            ],
        )
