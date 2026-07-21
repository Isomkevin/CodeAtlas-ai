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
