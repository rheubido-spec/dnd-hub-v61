from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260415_0006"
down_revision = "20260410_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "encounter_tracker_states",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False, server_default="Encounter Tracker"),
        sa.Column("tracker_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_encounter_tracker_states_id"), "encounter_tracker_states", ["id"], unique=False)
    op.create_index(op.f("ix_encounter_tracker_states_owner_id"), "encounter_tracker_states", ["owner_id"], unique=False)
    op.create_index(op.f("ix_encounter_tracker_states_title"), "encounter_tracker_states", ["title"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_encounter_tracker_states_title"), table_name="encounter_tracker_states")
    op.drop_index(op.f("ix_encounter_tracker_states_owner_id"), table_name="encounter_tracker_states")
    op.drop_index(op.f("ix_encounter_tracker_states_id"), table_name="encounter_tracker_states")
    op.drop_table("encounter_tracker_states")
