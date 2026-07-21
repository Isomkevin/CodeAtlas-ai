"""Create approval-gated implementation plans."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "20260721_06"
down_revision = "20260721_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    plan_status = postgresql.ENUM(
        "draft", "approved", "pull_request_opened", "failed", name="implementation_plan_status", create_type=False
    )
    plan_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "implementation_plans",
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
        sa.Column(
            "requested_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False
        ),
        sa.Column(
            "approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True
        ),
        sa.Column("status", plan_status, nullable=False, server_default="draft"),
        sa.Column("change_request", sa.Text(), nullable=False),
        sa.Column("plan", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("pull_request_url", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_implementation_plans_repository_id", "implementation_plans", ["repository_id"]
    )
    op.create_index(
        "ix_implementation_plans_graph_version_id", "implementation_plans", ["graph_version_id"]
    )
    op.create_index(
        "ix_implementation_plans_requested_by", "implementation_plans", ["requested_by"]
    )


def downgrade() -> None:
    op.drop_table("implementation_plans")
    postgresql.ENUM(name="implementation_plan_status").drop(op.get_bind(), checkfirst=True)
