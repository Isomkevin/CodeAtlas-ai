from pathlib import Path

from app.modules.repository.parser import extract_source_facts


def test_extracts_python_symbols_and_imports(tmp_path: Path) -> None:
    (tmp_path / "module.py").write_text("import os\nclass Service: pass\nasync def run(): pass\n")

    facts = extract_source_facts(tmp_path)

    assert {(fact.kind, fact.name) for fact in facts} == {
        ("import", "os"),
        ("class", "Service"),
        ("function", "run"),
    }


def test_extracts_typescript_symbols_and_imports_from_ast(tmp_path: Path) -> None:
    (tmp_path / "service.ts").write_text(
        'import { client } from "./client";\n'
        "export class Service {}\n"
        "export const run = () => client();\n"
    )

    facts = extract_source_facts(tmp_path)

    assert {(fact.kind, fact.name) for fact in facts} == {
        ("import", "./client"),
        ("class", "Service"),
        ("function", "run"),
    }
