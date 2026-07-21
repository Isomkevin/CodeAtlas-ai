"""Regression tests for deterministic source-fact extraction."""

from app.modules.repository.parser import extract_source_facts


def test_javascript_facts_do_not_require_a_native_parser(tmp_path) -> None:
    source = tmp_path / "sample.ts"
    source.write_text(
        "import { helper } from './helper';\n"
        "import './styles.css';\n"
        "export interface Runner {}\n"
        "export class Service {}\n"
        "function named() {}\n"
        "const callback = async (value: string) => value;\n",
        encoding="utf-8",
    )

    facts = extract_source_facts(tmp_path)

    assert {(fact.kind, fact.name) for fact in facts} == {
        ("import", "./helper"),
        ("import", "./styles.css"),
        ("class", "Runner"),
        ("class", "Service"),
        ("function", "named"),
        ("function", "callback"),
    }
