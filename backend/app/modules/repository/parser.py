"""Deterministic, language-aware source fact extraction."""

import ast
import re
from dataclasses import dataclass
from pathlib import Path


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
        elif path.suffix in {".js", ".jsx", ".ts", ".tsx"}:
            facts.extend(_extract_javascript_facts(path, relative))
    return facts


def _extract_python_facts(path: Path, relative: str) -> list[SourceFact]:
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=relative)
    except (OSError, SyntaxError, UnicodeDecodeError):
        return []
    facts: list[SourceFact] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            facts.append(SourceFact(relative, "function", node.name, node.lineno))
        elif isinstance(node, ast.ClassDef):
            facts.append(SourceFact(relative, "class", node.name, node.lineno))
        elif isinstance(node, ast.Import):
            for alias in node.names:
                facts.append(SourceFact(relative, "import", alias.name, node.lineno))
        elif isinstance(node, ast.ImportFrom) and node.module:
            facts.append(SourceFact(relative, "import", node.module, node.lineno))
    return facts


def _extract_javascript_facts(path: Path, relative: str) -> list[SourceFact]:
    """Extract high-signal JS/TS symbols without loading a native parser in worker processes."""
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []
    facts: list[SourceFact] = []
    patterns = (
        ("class", re.compile(r"\b(?:class|interface)\s+([A-Za-z_$][\w$]*)")),
        ("function", re.compile(r"\bfunction\s+([A-Za-z_$][\w$]*)")),
        (
            "function",
            re.compile(
                r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>"
            ),
        ),
        ("import", re.compile(r"\bfrom\s+[\"']([^\"']+)[\"']")),
        ("import", re.compile(r"\bimport\s+[\"']([^\"']+)[\"']")),
    )
    for kind, pattern in patterns:
        for match in pattern.finditer(source):
            line = source.count("\n", 0, match.start()) + 1
            facts.append(SourceFact(relative, kind, match.group(1), line))
    return facts
