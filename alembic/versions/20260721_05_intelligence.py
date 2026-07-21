"""Create persistent architecture drift observations."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260721_05"
down_revision = "20260721_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "architecture_drifts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "repository_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("repositories.id"),
            nullable=False,
        ),
        sa.Column(
            "graph_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("architecture_graph_versions.id"),
            nullable=False,
        ),
        sa.Column("source_node_id", sa.String(64), nullable=False),
        sa.Column("target_node_id", sa.String(64), nullable=False),
        sa.Column("kind", sa.String(64), nullable=False),
        sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint(
            "graph_version_id", "source_node_id", "target_node_id", "kind", name="uq_graph_drift"
        ),
    )
    op.create_index(
        "ix_architecture_drifts_repository_id", "architecture_drifts", ["repository_id"]
    )
    op.create_index(
        "ix_architecture_drifts_graph_version_id", "architecture_drifts", ["graph_version_id"]
    )


def downgrade() -> None:
    op.drop_table("architecture_drifts")
