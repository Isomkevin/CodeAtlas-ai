"""Repository scanner used by the background execution adapter."""

import shutil
import subprocess
import tempfile
from dataclasses import asdict
from pathlib import Path

from app.modules.repository.parser import extract_source_facts


def scan_repository(clone_url: str, branch: str) -> tuple[str, dict]:
    """Shallow-clone a repository and return deterministic source facts and commit SHA."""

    workspace = Path(tempfile.mkdtemp(prefix="codeatlas-scan-"))
    checkout = workspace / "repository"
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", "--branch", branch, clone_url, str(checkout)],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
        commit_sha = subprocess.run(
            ["git", "-C", str(checkout), "rev-parse", "HEAD"],
            check=True,
            capture_output=True,
            text=True,
            timeout=10,
        ).stdout.strip()
        facts = extract_source_facts(checkout)
        return commit_sha, {"fact_count": len(facts), "facts": [asdict(fact) for fact in facts]}
    finally:
        shutil.rmtree(workspace, ignore_errors=True)
