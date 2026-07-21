from uuid import uuid4

from app.modules.documentation.models import ArtifactKind
from app.modules.documentation.renderers import render_artifact
from app.modules.graph.models import GraphEdge, GraphNode


def test_renderers_are_graph_derived_and_emit_each_supported_format() -> None:
    repository_id = uuid4()
    nodes = [
        GraphNode("module", "module", "app/service.py", repository_id, {"path": "app/service.py"}),
        GraphNode("function", "function", "run", repository_id, {"path": "app/service.py"}),
    ]
    edges = [GraphEdge("contains", "module", "function", "contains", repository_id)]

    documentation = render_artifact(ArtifactKind.DOCUMENTATION, nodes, edges)
    mermaid = render_artifact(ArtifactKind.MERMAID, nodes, edges)
    drawio = render_artifact(ArtifactKind.DRAWIO, nodes, edges)
    c4 = render_artifact(ArtifactKind.C4, nodes, edges)

    assert "app/service.py" in documentation
    assert "flowchart TD" in mermaid
    assert "<mxfile" in drawio
    assert "@startuml" in c4
