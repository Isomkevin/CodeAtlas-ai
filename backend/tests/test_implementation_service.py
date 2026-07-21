from uuid import uuid4

from app.modules.graph.models import GraphNode


def test_plan_keywords_select_relevant_graph_nodes() -> None:
    repository_id = uuid4()
    nodes = [
        GraphNode("billing", "class", "BillingService", repository_id, {"path": "billing.py"}),
        GraphNode("other", "class", "OtherService", repository_id, {"path": "other.py"}),
    ]

    keywords = {"billing", "gateway"}
    selected = [
        node
        for node in nodes
        if any(
            word in f"{node.name} {node.properties.get('path', '')}".lower() for word in keywords
        )
    ]

    assert [node.id for node in selected] == ["billing"]
