"""Repository scanner used by the background execution adapter."""

import base64
import shutil
import subprocess
import tempfile
from dataclasses import asdict
from pathlib import Path

from app.modules.repository.parser import extract_source_facts


def scan_repository(
    clone_url: str, branch: str, access_token: str | None = None
) -> tuple[str, dict]:
    """Shallow-clone a repository and return deterministic source facts and commit SHA."""

    workspace = Path(tempfile.mkdtemp(prefix="codeatlas-scan-"))
    checkout = workspace / "repository"
    try:
        command = ["git"]
        if access_token:
            basic = base64.b64encode(f"x-access-token:{access_token}".encode()).decode()
            command.extend(["-c", f"http.extraHeader=Authorization: Basic {basic}"])
        command.extend(["clone", "--depth", "1", "--branch", branch, clone_url, str(checkout)])
        subprocess.run(
            command,
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
