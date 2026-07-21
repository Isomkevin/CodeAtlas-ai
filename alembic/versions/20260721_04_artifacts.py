"""Create graph-derived architecture artifact catalog."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260721_04"
down_revision = "20260721_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    artifact_kind = postgresql.ENUM(
        "documentation", "mermaid", "drawio", "c4", name="artifact_kind", create_type=False
    )
    artifact_kind.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "architecture_artifacts",
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
        sa.Column("kind", artifact_kind, nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("graph_version_id", "kind", "content_hash", name="uq_artifact_content"),
    )
    op.create_index(
        "ix_architecture_artifacts_repository_id", "architecture_artifacts", ["repository_id"]
    )
    op.create_index(
        "ix_architecture_artifacts_graph_version_id", "architecture_artifacts", ["graph_version_id"]
    )


def downgrade() -> None:
    op.drop_table("architecture_artifacts")
    postgresql.ENUM(name="artifact_kind").drop(op.get_bind(), checkfirst=True)
