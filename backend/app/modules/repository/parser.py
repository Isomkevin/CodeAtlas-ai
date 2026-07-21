"""Deterministic, language-aware source fact extraction."""

import ast
from dataclasses import dataclass
from pathlib import Path

import tree_sitter_javascript
import tree_sitter_typescript
from tree_sitter import Language, Parser


@dataclass(frozen=True)
class SourceFact:
    path: str
    kind: str
    name: str
    line: int


def extract_source_facts(root: Path) -> list[SourceFact]:
    """Extract symbols and imports through language-native AST parser adapters."""

    facts: list[SourceFact] = []
    for path in root.rglob("*"):
        if any(part in {".git", ".venv", "node_modules", "__pycache__"} for part in path.parts):
            continue
        if not path.is_file():
            continue
        relative = path.relative_to(root).as_posix()
        if path.suffix == ".py":
            facts.extend(_extract_python_facts(path, relative))
        elif path.suffix in {".js", ".jsx"}:
            facts.extend(
                _extract_tree_sitter_facts(
                    path, relative, tree_sitter_javascript.language()
                )
            )
        elif path.suffix in {".ts", ".tsx"}:
            language = (
                tree_sitter_typescript.language_tsx()
                if path.suffix == ".tsx"
                else tree_sitter_typescript.language_typescript()
            )
            facts.extend(_extract_tree_sitter_facts(path, relative, language))
    return facts


def _extract_python_facts(path: Path, relative: str) -> list[SourceFact]:
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=relative)
    except (OSError, SyntaxError, UnicodeDecodeError):
        return []
    facts: list[SourceFact] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            facts.append(SourceFact(relative, "function", node.name, node.lineno))
        elif isinstance(node, ast.ClassDef):
            facts.append(SourceFact(relative, "class", node.name, node.lineno))
        elif isinstance(node, ast.Import):
            for alias in node.names:
                facts.append(SourceFact(relative, "import", alias.name, node.lineno))
        elif isinstance(node, ast.ImportFrom) and node.module:
            facts.append(SourceFact(relative, "import", node.module, node.lineno))
    return facts


def _extract_tree_sitter_facts(path: Path, relative: str, capsule: object) -> list[SourceFact]:
    try:
        source = path.read_bytes()
    except OSError:
        return []
    parser = Parser(Language(capsule))
    tree = parser.parse(source)
    facts: list[SourceFact] = []
    stack = [tree.root_node]
    while stack:
        node = stack.pop()
        stack.extend(reversed(node.children))
        name_node = node.child_by_field_name("name")
        if node.type in {"class_declaration", "interface_declaration"} and name_node:
            facts.append(
                SourceFact(
                    relative, "class", _node_text(name_node, source), node.start_point.row + 1
                )
            )
        elif node.type in {"function_declaration", "method_definition"} and name_node:
            facts.append(
                SourceFact(
                    relative, "function", _node_text(name_node, source), node.start_point.row + 1
                )
            )
        elif node.type == "variable_declarator" and name_node:
            value = node.child_by_field_name("value")
            if value and value.type in {"arrow_function", "function_expression"}:
                facts.append(
                    SourceFact(
                        relative,
                        "function",
                        _node_text(name_node, source),
                        node.start_point.row + 1,
                    )
                )
        elif node.type == "import_statement":
            source_node = node.child_by_field_name("source")
            if source_node:
                facts.append(
                    SourceFact(
                        relative,
                        "import",
                        _node_text(source_node, source).strip("\"'"),
                        node.start_point.row + 1,
                    )
                )
    return facts


def _node_text(node, source: bytes) -> str:
    return source[node.start_byte : node.end_byte].decode("utf-8", errors="replace")
