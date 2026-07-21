"""Deterministic, language-aware source fact extraction."""

import ast
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SourceFact:
    path: str
    kind: str
    name: str
    line: int


def extract_source_facts(root: Path) -> list[SourceFact]:
    """Extract Python symbols/imports; unsupported files remain safely ignored."""

    facts: list[SourceFact] = []
    for path in root.rglob("*.py"):
        if any(part in {".git", ".venv", "node_modules", "__pycache__"} for part in path.parts):
            continue
        relative = path.relative_to(root).as_posix()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=relative)
        except (OSError, SyntaxError, UnicodeDecodeError):
            continue
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
