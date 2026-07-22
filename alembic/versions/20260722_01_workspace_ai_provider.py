"""Persist encrypted workspace BYOK AI provider configuration.

Revision ID: 20260722_01
Revises: 20260721_06
Create Date: 2026-07-22
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260722_01"
down_revision = "20260721_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "workspace_ai_providers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
            unique=True,
        ),
        sa.Column("provider", sa.String(64), nullable=False, server_default="openai-compatible"),
        sa.Column("encrypted_api_key", sa.Text(), nullable=False),
        sa.Column("base_url", sa.Text(), nullable=False),
        sa.Column("model", sa.String(160), nullable=False),
        sa.Column("key_hint", sa.String(24), nullable=False),
        sa.Column(
            "configured_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

def downgrade() -> None:
    op.drop_table("workspace_ai_providers")
