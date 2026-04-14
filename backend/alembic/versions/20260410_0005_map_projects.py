
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260410_0005"
down_revision = "20260409_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "map_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("map_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_map_projects_id"), "map_projects", ["id"], unique=False)
    op.create_index(op.f("ix_map_projects_owner_id"), "map_projects", ["owner_id"], unique=False)
    op.create_index(op.f("ix_map_projects_name"), "map_projects", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_map_projects_name"), table_name="map_projects")
    op.drop_index(op.f("ix_map_projects_owner_id"), table_name="map_projects")
    op.drop_index(op.f("ix_map_projects_id"), table_name="map_projects")
    op.drop_table("map_projects")
