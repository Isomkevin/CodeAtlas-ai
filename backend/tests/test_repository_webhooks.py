"""Contract tests for verified GitHub scan webhooks."""

import hashlib
import hmac
import json
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.config import Settings
from app.main import create_app
from app.modules.repository.service import RepositoryService
from app.modules.repository.webhooks import get_repository_service


def _signature(body: bytes, secret: str = "webhook-test-secret") -> str:
    return "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


def _client(store: object) -> TestClient:
    app = create_app(
        Settings(
            environment="test",
            allowed_origins=[],
            redis_url="redis://localhost:6379/15",
            github_webhook_secret=SecretStr("webhook-test-secret"),
        )
    )
    app.dependency_overrides[get_repository_service] = lambda: RepositoryService(store)  # type: ignore[arg-type]
    return TestClient(app)


def test_github_webhook_rejects_invalid_signature() -> None:
    with _client(object()) as client:
        response = client.post(
            "/api/v1/github/webhooks",
            content=b"{}",
            headers={"X-GitHub-Event": "ping", "X-Hub-Signature-256": "sha256=invalid"},
        )

    assert response.status_code == 401


def test_github_push_queues_default_branch_scans(monkeypatch) -> None:
    repository = SimpleNamespace(id=uuid4(), default_branch="main")
    scan = SimpleNamespace(id=uuid4())
    queued: list[str] = []

    class Store:
        async def list_by_full_name(self, full_name: str):
            assert full_name == "codeatlas/api"
            return [repository]

        async def queue_scan(self, repository_id):
            assert repository_id == repository.id
            return scan

        async def commit(self):
            return None

    monkeypatch.setattr(
        "app.modules.repository.webhooks.run_repository_scan.delay",
        lambda scan_id: queued.append(scan_id),
    )
    body = json.dumps(
        {
            "ref": "refs/heads/main",
            "after": "a" * 40,
            "repository": {"full_name": "codeatlas/api"},
        }
    ).encode()
    with _client(Store()) as client:
        response = client.post(
            "/api/v1/github/webhooks",
            content=body,
            headers={"X-GitHub-Event": "push", "X-Hub-Signature-256": _signature(body)},
        )

    assert response.status_code == 202
    assert response.json() == {"accepted": True, "event": "push", "queued_scans": 1}
    assert queued == [str(scan.id)]
