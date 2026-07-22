import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest
from cryptography.fernet import Fernet

from app.config import Settings
from app.modules.intelligence.service import AIConfigurationError, ArchitectureIntelligenceService


class ProviderRepository:
    def __init__(self, provider):
        self.provider = provider

    async def get_workspace_ai_provider(self, _organization_id):
        return self.provider


def test_workspace_byok_key_is_encrypted_and_takes_precedence_over_deployment_key() -> None:
    key = Fernet.generate_key().decode()
    settings = Settings(
        ai_key_encryption_key=key,
        ai_api_key="deployment-key",
        ai_model="deployment-model",
    )
    service = ArchitectureIntelligenceService(None, ProviderRepository(None), settings)  # type: ignore[arg-type]
    encrypted = service._encrypt_workspace_api_key("workspace-key")

    assert encrypted != "workspace-key"
    assert service._decrypt_workspace_api_key(encrypted) == "workspace-key"

    service._drifts.provider = SimpleNamespace(
        encrypted_api_key=encrypted,
        base_url="https://models.example.com/v1",
        model_name="workspace-model",
    )
    configuration = asyncio.run(service._resolve_model_configuration(uuid4()))

    assert configuration is not None
    assert configuration.api_key == "workspace-key"
    assert configuration.model == "workspace-model"
    assert configuration.source == "workspace_byok"


def test_workspace_byok_rejects_an_invalid_fernet_key() -> None:
    settings = Settings(ai_key_encryption_key="not-a-fernet-key")
    service = ArchitectureIntelligenceService(None, ProviderRepository(None), settings)  # type: ignore[arg-type]

    with pytest.raises(AIConfigurationError, match="valid Fernet key"):
        service._encrypt_workspace_api_key("workspace-key")
