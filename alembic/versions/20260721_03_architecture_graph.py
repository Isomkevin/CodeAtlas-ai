"""Create architecture graph catalog and credential ownership linkage."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260721_03"
down_revision = "20260721_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    graph_version_status = postgresql.ENUM(
        "projecting", "ready", "failed", name="graph_version_status"
    )
    graph_version_status.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "repositories",
        sa.Column("credential_owner_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_repositories_credential_owner",
        "repositories",
        "users",
        ["credential_owner_id"],
        ["id"],
    )
    op.create_table(
        "architecture_graph_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "repository_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("repositories.id"),
            nullable=False,
        ),
        sa.Column(
            "scan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("repository_scans.id"),
            nullable=False,
        ),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column(
            "parent_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("architecture_graph_versions.id"),
            nullable=True,
        ),
        sa.Column("commit_sha", sa.String(64), nullable=False),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("status", graph_version_status, nullable=False, server_default="projecting"),
        sa.Column("summary", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("scan_id", name="uq_graph_version_scan"),
    )
    op.create_index(
        "ix_architecture_graph_versions_repository_id",
        "architecture_graph_versions",
        ["repository_id"],
    )
    op.create_index(
        "ix_architecture_graph_versions_scan_id", "architecture_graph_versions", ["scan_id"]
    )


def downgrade() -> None:
    op.drop_table("architecture_graph_versions")
    op.drop_constraint("fk_repositories_credential_owner", "repositories", type_="foreignkey")
    op.drop_column("repositories", "credential_owner_id")
    postgresql.ENUM(name="graph_version_status").drop(op.get_bind(), checkfirst=True)
