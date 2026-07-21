"""Deterministic, graph-only renderers for architecture artifacts."""

from collections import defaultdict
from xml.sax.saxutils import escape

from app.modules.documentation.models import ArtifactKind
from app.modules.graph.models import GraphEdge, GraphNode


def render_artifact(kind: ArtifactKind, nodes: list[GraphNode], edges: list[GraphEdge]) -> str:
    renderers = {
        ArtifactKind.DOCUMENTATION: render_documentation,
        ArtifactKind.MERMAID: render_mermaid,
        ArtifactKind.DRAWIO: render_drawio,
        ArtifactKind.C4: render_c4,
    }
    return renderers[kind](nodes, edges)


def render_documentation(nodes: list[GraphNode], edges: list[GraphEdge]) -> str:
    grouped: dict[str, list[GraphNode]] = defaultdict(list)
    for node in nodes:
        grouped[node.kind].append(node)
    lines = ["# Architecture", "", "## Components", ""]
    for kind in sorted(grouped):
        lines.extend([f"### {kind.replace('_', ' ').title()}", ""])
        for node in sorted(grouped[kind], key=lambda item: item.name):
            location = node.properties.get("path")
            suffix = f" (`{location}`)" if location else ""
            lines.append(f"- **{node.name}**{suffix}")
        lines.append("")
    lines.extend(["## Relationships", ""])
    node_names = {node.id: node.name for node in nodes}
    for edge in sorted(edges, key=lambda item: item.id):
        lines.append(
            f"- `{node_names[edge.source_id]}` {edge.kind.replace('_', ' ')} "
            f"`{node_names[edge.target_id]}`"
        )
    return "\n".join(lines).rstrip() + "\n"


def render_mermaid(nodes: list[GraphNode], edges: list[GraphEdge]) -> str:
    lines = ["flowchart TD"]
    for node in sorted(nodes, key=lambda item: item.id):
        lines.append(f'  n_{node.id[:12]}["{_mermaid_text(node.name)}"]')
    for edge in sorted(edges, key=lambda item: item.id):
        lines.append(
            f"  n_{edge.source_id[:12]} -->|{_mermaid_text(edge.kind)}| n_{edge.target_id[:12]}"
        )
    return "\n".join(lines) + "\n"


def render_c4(nodes: list[GraphNode], edges: list[GraphEdge]) -> str:
    lines = ["@startuml", "!include <C4/C4_Component>", ""]
    for node in sorted(nodes, key=lambda item: item.id):
        alias = f"n_{node.id[:12]}"
        lines.append(
            f'Component({alias}, "{_plantuml_text(node.name)}", "{_plantuml_text(node.kind)}")'
        )
    lines.append("")
    for edge in sorted(edges, key=lambda item: item.id):
        lines.append(
            f'Rel(n_{edge.source_id[:12]}, n_{edge.target_id[:12]}, "{_plantuml_text(edge.kind)}")'
        )
    lines.extend(["", "@enduml"])
    return "\n".join(lines) + "\n"


def render_drawio(nodes: list[GraphNode], edges: list[GraphEdge]) -> str:
    cells = [
        '<mxCell id="0"/>',
        '<mxCell id="1" parent="0"/>',
    ]
    for index, node in enumerate(sorted(nodes, key=lambda item: item.id)):
        x = 40 + (index % 4) * 220
        y = 40 + (index // 4) * 110
        cells.append(
            "".join(
                [
                    f'<mxCell id="n_{node.id}" value="{escape(node.name)}" ',
                    'style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">',
                    f'<mxGeometry x="{x}" y="{y}" width="180" height="60" ',
                    'as="geometry"/></mxCell>',
                ]
            )
        )
    for edge in sorted(edges, key=lambda item: item.id):
        cells.append(
            "".join(
                [
                    f'<mxCell id="e_{edge.id}" value="{escape(edge.kind)}" ',
                    'style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;" edge="1" ',
                    f'source="n_{edge.source_id}" target="n_{edge.target_id}" parent="1">',
                    '<mxGeometry relative="1" as="geometry"/></mxCell>',
                ]
            )
        )
    body = "".join(cells)
    return (
        '<mxfile host="CodeAtlas" type="device"><diagram id="architecture" name="Architecture">'
        f"<mxGraphModel><root>{body}</root></mxGraphModel></diagram></mxfile>"
    )


def _mermaid_text(value: str) -> str:
    return value.replace('"', "'").replace("\n", " ")


def _plantuml_text(value: str) -> str:
    return value.replace('"', "'").replace("\n", " ")
