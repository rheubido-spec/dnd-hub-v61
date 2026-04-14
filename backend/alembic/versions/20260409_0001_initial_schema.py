"""Initial schema with party audit logs"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260409_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "parties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("theme", sa.String(length=80), nullable=False, server_default="Classic Fantasy"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_parties_id"), "parties", ["id"], unique=False)
    op.create_index(op.f("ix_parties_owner_id"), "parties", ["owner_id"], unique=False)
    op.create_index(op.f("ix_parties_name"), "parties", ["name"], unique=False)

    op.create_table(
        "party_memberships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("party_id", sa.Integer(), sa.ForeignKey("parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="player"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("party_id", "user_id", name="uq_party_user"),
    )
    op.create_index(op.f("ix_party_memberships_id"), "party_memberships", ["id"], unique=False)
    op.create_index(op.f("ix_party_memberships_party_id"), "party_memberships", ["party_id"], unique=False)
    op.create_index(op.f("ix_party_memberships_user_id"), "party_memberships", ["user_id"], unique=False)

    op.create_table(
        "party_invites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("party_id", sa.Integer(), sa.ForeignKey("parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invitee_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_party_invites_id"), "party_invites", ["id"], unique=False)
    op.create_index(op.f("ix_party_invites_party_id"), "party_invites", ["party_id"], unique=False)
    op.create_index(op.f("ix_party_invites_invitee_user_id"), "party_invites", ["invitee_user_id"], unique=False)
    op.create_index(op.f("ix_party_invites_invited_by_user_id"), "party_invites", ["invited_by_user_id"], unique=False)

    op.create_table(
        "characters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("party_id", sa.Integer(), sa.ForeignKey("parties.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("lineage", sa.String(length=80), nullable=False),
        sa.Column("char_class", sa.String(length=80), nullable=False),
        sa.Column("background", sa.String(length=120), nullable=False, server_default="Custom"),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("alignment", sa.String(length=40), nullable=False, server_default="Unaligned"),
        sa.Column("shared_with_party", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("sheet_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_characters_id"), "characters", ["id"], unique=False)
    op.create_index(op.f("ix_characters_owner_id"), "characters", ["owner_id"], unique=False)
    op.create_index(op.f("ix_characters_party_id"), "characters", ["party_id"], unique=False)
    op.create_index(op.f("ix_characters_name"), "characters", ["name"], unique=False)

    op.create_table(
        "campaigns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dm_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("party_id", sa.Integer(), sa.ForeignKey("parties.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("theme", sa.String(length=80), nullable=False, server_default="High Fantasy"),
        sa.Column("setting_name", sa.String(length=120), nullable=False, server_default="Homebrew Realm"),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=40), nullable=False, server_default="draft"),
        sa.Column("campaign_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_campaigns_id"), "campaigns", ["id"], unique=False)
    op.create_index(op.f("ix_campaigns_owner_id"), "campaigns", ["owner_id"], unique=False)
    op.create_index(op.f("ix_campaigns_dm_user_id"), "campaigns", ["dm_user_id"], unique=False)
    op.create_index(op.f("ix_campaigns_party_id"), "campaigns", ["party_id"], unique=False)
    op.create_index(op.f("ix_campaigns_title"), "campaigns", ["title"], unique=False)

    op.create_table(
        "forum_threads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("topic", sa.String(length=80), nullable=False, server_default="general"),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_forum_threads_id"), "forum_threads", ["id"], unique=False)
    op.create_index(op.f("ix_forum_threads_author_id"), "forum_threads", ["author_id"], unique=False)
    op.create_index(op.f("ix_forum_threads_title"), "forum_threads", ["title"], unique=False)

    op.create_table(
        "forum_posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("thread_id", sa.Integer(), sa.ForeignKey("forum_threads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_forum_posts_id"), "forum_posts", ["id"], unique=False)
    op.create_index(op.f("ix_forum_posts_thread_id"), "forum_posts", ["thread_id"], unique=False)
    op.create_index(op.f("ix_forum_posts_author_id"), "forum_posts", ["author_id"], unique=False)

    op.create_table(
        "party_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("party_id", sa.Integer(), sa.ForeignKey("parties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=40), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(op.f("ix_party_audit_logs_id"), "party_audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_party_audit_logs_party_id"), "party_audit_logs", ["party_id"], unique=False)
    op.create_index(op.f("ix_party_audit_logs_actor_id"), "party_audit_logs", ["actor_id"], unique=False)
    op.create_index(op.f("ix_party_audit_logs_action"), "party_audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_party_audit_logs_entity_type"), "party_audit_logs", ["entity_type"], unique=False)
    op.create_index(op.f("ix_party_audit_logs_created_at"), "party_audit_logs", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_party_audit_logs_created_at"), table_name="party_audit_logs")
    op.drop_index(op.f("ix_party_audit_logs_entity_type"), table_name="party_audit_logs")
    op.drop_index(op.f("ix_party_audit_logs_action"), table_name="party_audit_logs")
    op.drop_index(op.f("ix_party_audit_logs_actor_id"), table_name="party_audit_logs")
    op.drop_index(op.f("ix_party_audit_logs_party_id"), table_name="party_audit_logs")
    op.drop_index(op.f("ix_party_audit_logs_id"), table_name="party_audit_logs")
    op.drop_table("party_audit_logs")
    op.drop_index(op.f("ix_forum_posts_author_id"), table_name="forum_posts")
    op.drop_index(op.f("ix_forum_posts_thread_id"), table_name="forum_posts")
    op.drop_index(op.f("ix_forum_posts_id"), table_name="forum_posts")
    op.drop_table("forum_posts")
    op.drop_index(op.f("ix_forum_threads_title"), table_name="forum_threads")
    op.drop_index(op.f("ix_forum_threads_author_id"), table_name="forum_threads")
    op.drop_index(op.f("ix_forum_threads_id"), table_name="forum_threads")
    op.drop_table("forum_threads")
    op.drop_index(op.f("ix_campaigns_title"), table_name="campaigns")
    op.drop_index(op.f("ix_campaigns_party_id"), table_name="campaigns")
    op.drop_index(op.f("ix_campaigns_dm_user_id"), table_name="campaigns")
    op.drop_index(op.f("ix_campaigns_owner_id"), table_name="campaigns")
    op.drop_index(op.f("ix_campaigns_id"), table_name="campaigns")
    op.drop_table("campaigns")
    op.drop_index(op.f("ix_characters_name"), table_name="characters")
    op.drop_index(op.f("ix_characters_party_id"), table_name="characters")
    op.drop_index(op.f("ix_characters_owner_id"), table_name="characters")
    op.drop_index(op.f("ix_characters_id"), table_name="characters")
    op.drop_table("characters")
    op.drop_index(op.f("ix_party_invites_invited_by_user_id"), table_name="party_invites")
    op.drop_index(op.f("ix_party_invites_invitee_user_id"), table_name="party_invites")
    op.drop_index(op.f("ix_party_invites_party_id"), table_name="party_invites")
    op.drop_index(op.f("ix_party_invites_id"), table_name="party_invites")
    op.drop_table("party_invites")
    op.drop_index(op.f("ix_party_memberships_user_id"), table_name="party_memberships")
    op.drop_index(op.f("ix_party_memberships_party_id"), table_name="party_memberships")
    op.drop_index(op.f("ix_party_memberships_id"), table_name="party_memberships")
    op.drop_table("party_memberships")
    op.drop_index(op.f("ix_parties_name"), table_name="parties")
    op.drop_index(op.f("ix_parties_owner_id"), table_name="parties")
    op.drop_index(op.f("ix_parties_id"), table_name="parties")
    op.drop_table("parties")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
