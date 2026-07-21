from uuid import uuid4

from app.modules.graph.models import GraphEdge, GraphNode
from app.modules.intelligence.service import ArchitectureIntelligenceService


def test_graph_chat_answer_and_impact_are_derived_from_graph_relationships() -> None:
    repository_id = uuid4()
    api = GraphNode("api", "module", "api.py", repository_id)
    service = GraphNode("service", "class", "BillingService", repository_id)
    database = GraphNode("database", "external_module", "postgres", repository_id)
    edges = [
        GraphEdge("edge-api-service", api.id, service.id, "contains", repository_id),
        GraphEdge("edge-service-db", service.id, database.id, "imports", repository_id),
    ]

    answer = ArchitectureIntelligenceService._deterministic_answer(
        "What depends on BillingService?", [api, service, database], edges, [service]
    )

    assert "BillingService" in answer
    assert "postgres" in answer
