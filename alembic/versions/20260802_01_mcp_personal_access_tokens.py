"""Persist MCP personal access tokens for the coding bridge.

Revision ID: 20260802_01
Revises: 20260722_01
Create Date: 2026-08-02
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260802_01"
down_revision = "20260722_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mcp_personal_access_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("token_hash", sa.Text(), nullable=False, unique=True),
        sa.Column("prefix", sa.String(16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_mcp_personal_access_tokens_organization_id",
        "mcp_personal_access_tokens",
        ["organization_id"],
    )
    op.create_index(
        "ix_mcp_personal_access_tokens_user_id",
        "mcp_personal_access_tokens",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_mcp_personal_access_tokens_user_id", table_name="mcp_personal_access_tokens")
    op.drop_index(
        "ix_mcp_personal_access_tokens_organization_id", table_name="mcp_personal_access_tokens"
    )
    op.drop_table("mcp_personal_access_tokens")
