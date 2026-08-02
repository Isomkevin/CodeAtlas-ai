"""MCP personal access token minting, hashing, and lookup helpers."""

import hashlib
import secrets

PAT_PREFIX = "cak_"
_TOKEN_ENTROPY_BYTES = 32


def mint_raw_token() -> str:
    """Generate a fresh personal access token in the `cak_` prefix format."""

    return f"{PAT_PREFIX}{secrets.token_urlsafe(_TOKEN_ENTROPY_BYTES)}"


def hash_token(raw_token: str) -> str:
    """Deterministic SHA-256 hash used for lookup; tokens are high-entropy so no salt needed."""

    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def visible_prefix(raw_token: str) -> str:
    """First 12 characters of the token, shown in listing UIs and audit logs."""

    return raw_token[:12]
