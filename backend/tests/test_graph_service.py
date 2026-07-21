from types import SimpleNamespace
from uuid import uuid4

from app.modules.graph.service import GraphService


def test_projection_derives_modules_symbols_and_dependencies_from_source_facts() -> None:
    repository_id = uuid4()
    facts = [
        SimpleNamespace(path="app/service.py", kind="import", name="httpx", line=1),
        SimpleNamespace(path="app/service.py", kind="class", name="Service", line=4),
        SimpleNamespace(path="app/service.py", kind="function", name="run", line=9),
    ]

    nodes, edges = GraphService._build_projection(repository_id, facts)

    assert {(node.kind, node.name) for node in nodes} == {
        ("module", "app/service.py"),
        ("external_module", "httpx"),
        ("class", "Service"),
        ("function", "run"),
    }
    assert {edge.kind for edge in edges} == {"contains", "imports"}
    assert len(edges) == 3


def test_projection_fingerprint_is_deterministic() -> None:
    repository_id = uuid4()
    facts = [SimpleNamespace(path="module.py", kind="function", name="run", line=3)]

    first_nodes, first_edges = GraphService._build_projection(repository_id, facts)
    second_nodes, second_edges = GraphService._build_projection(repository_id, facts)

    assert GraphService._fingerprint(first_nodes, first_edges) == GraphService._fingerprint(
        second_nodes, second_edges
    )
