"""Add invite role persistence and audit log composite indexes"""

from alembic import op
import sqlalchemy as sa

revision = "20260409_0002"
down_revision = "20260409_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("party_invites", sa.Column("role", sa.String(length=20), nullable=False, server_default="player"))
    op.create_index(
        "ix_party_audit_logs_party_created_desc",
        "party_audit_logs",
        ["party_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_party_audit_logs_party_action_created",
        "party_audit_logs",
        ["party_id", "action", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_party_audit_logs_party_entity_created",
        "party_audit_logs",
        ["party_id", "entity_type", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_party_audit_logs_party_entity_created", table_name="party_audit_logs")
    op.drop_index("ix_party_audit_logs_party_action_created", table_name="party_audit_logs")
    op.drop_index("ix_party_audit_logs_party_created_desc", table_name="party_audit_logs")
    op.drop_column("party_invites", "role")
