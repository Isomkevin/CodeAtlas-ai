"""Create repository and source-ingestion tables."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260721_01"
down_revision = "20260720_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    scan_status = postgresql.ENUM(
        "queued", "running", "completed", "failed", name="scan_status", create_type=False
    )
    scan_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "repositories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(24), nullable=False, server_default="github"),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("clone_url", sa.Text(), nullable=False),
        sa.Column("default_branch", sa.String(255), nullable=False, server_default="main"),
        sa.Column("status", sa.String(24), nullable=False, server_default="active"),
        sa.Column("metadata", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "full_name", name="uq_repository_org_name"),
    )
    op.create_index("ix_repositories_organization_id", "repositories", ["organization_id"])
    op.create_table(
        "repository_scans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "repository_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("repositories.id"),
            nullable=False,
        ),
        sa.Column("status", scan_status, nullable=False, server_default="queued"),
        sa.Column("commit_sha", sa.String(64)),
        sa.Column("summary", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("error", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_repository_scans_repository_id", "repository_scans", ["repository_id"])
    op.create_table(
        "source_facts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "scan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("repository_scans.id"),
            nullable=False,
        ),
        sa.Column("path", sa.Text(), nullable=False),
        sa.Column("kind", sa.String(32), nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("line", sa.Integer(), nullable=False),
        sa.UniqueConstraint("scan_id", "path", "kind", "name", "line", name="uq_source_fact"),
    )
    op.create_index("ix_source_facts_scan_id", "source_facts", ["scan_id"])


def downgrade() -> None:
    op.drop_table("source_facts")
    op.drop_table("repository_scans")
    op.drop_table("repositories")
    postgresql.ENUM(name="scan_status").drop(op.get_bind(), checkfirst=True)
