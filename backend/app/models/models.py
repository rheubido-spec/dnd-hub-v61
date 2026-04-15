
from __future__ import annotations

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    characters: Mapped[list[Character]] = relationship(back_populates="owner", cascade="all, delete-orphan", foreign_keys="Character.owner_id")
    campaigns: Mapped[list[Campaign]] = relationship(back_populates="owner", cascade="all, delete-orphan", foreign_keys="Campaign.owner_id")
    dm_campaigns: Mapped[list[Campaign]] = relationship(back_populates="dm_user", foreign_keys="Campaign.dm_user_id")
    parties_owned: Mapped[list[Party]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    memberships: Mapped[list[PartyMembership]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sent_invites: Mapped[list[PartyInvite]] = relationship(back_populates="invited_by", foreign_keys="PartyInvite.invited_by_user_id")
    received_invites: Mapped[list[PartyInvite]] = relationship(back_populates="invitee", foreign_keys="PartyInvite.invitee_user_id")
    threads: Mapped[list[ForumThread]] = relationship(back_populates="author", cascade="all, delete-orphan")
    posts: Mapped[list[ForumPost]] = relationship(back_populates="author", cascade="all, delete-orphan")
    party_audit_logs: Mapped[list[PartyAuditLog]] = relationship(back_populates="actor", foreign_keys="PartyAuditLog.actor_id")
    maintenance_runs: Mapped[list[MaintenanceAgentRun]] = relationship(back_populates="created_by", foreign_keys="MaintenanceAgentRun.created_by_user_id")
    map_projects: Mapped[list[MapProject]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    tracker_states: Mapped[list["EncounterTrackerState"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

class Party(Base, TimestampMixin):
    __tablename__ = "parties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    theme: Mapped[str] = mapped_column(String(80), default="Classic Fantasy")

    owner: Mapped[User] = relationship(back_populates="parties_owned")
    memberships: Mapped[list[PartyMembership]] = relationship(back_populates="party", cascade="all, delete-orphan")
    invites: Mapped[list[PartyInvite]] = relationship(back_populates="party", cascade="all, delete-orphan")
    characters: Mapped[list[Character]] = relationship(back_populates="party")
    campaigns: Mapped[list[Campaign]] = relationship(back_populates="party")
    audit_logs: Mapped[list[PartyAuditLog]] = relationship(back_populates="party", cascade="all, delete-orphan")
    archived_audit_logs: Mapped[list[PartyAuditLogArchive]] = relationship(back_populates="party", cascade="all, delete-orphan")


class PartyMembership(Base, TimestampMixin):
    __tablename__ = "party_memberships"
    __table_args__ = (UniqueConstraint("party_id", "user_id", name="uq_party_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="player")

    party: Mapped[Party] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(back_populates="memberships")


class PartyInvite(Base, TimestampMixin):
    __tablename__ = "party_invites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id", ondelete="CASCADE"), index=True)
    invitee_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    invited_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20), default="player")
    status: Mapped[str] = mapped_column(String(20), default="pending")

    party: Mapped[Party] = relationship(back_populates="invites")
    invitee: Mapped[User] = relationship(back_populates="received_invites", foreign_keys=[invitee_user_id])
    invited_by: Mapped[User] = relationship(back_populates="sent_invites", foreign_keys=[invited_by_user_id])


class Character(Base, TimestampMixin):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    party_id: Mapped[int | None] = mapped_column(ForeignKey("parties.id", ondelete="SET NULL"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    lineage: Mapped[str] = mapped_column(String(80))
    char_class: Mapped[str] = mapped_column(String(80))
    background: Mapped[str] = mapped_column(String(120), default="Custom")
    level: Mapped[int] = mapped_column(Integer, default=1)
    alignment: Mapped[str] = mapped_column(String(40), default="Unaligned")
    shared_with_party: Mapped[bool] = mapped_column(Boolean, default=False)
    sheet_data: Mapped[dict] = mapped_column(JSONB, default=dict)

    owner: Mapped[User] = relationship(back_populates="characters", foreign_keys=[owner_id])
    party: Mapped[Party | None] = relationship(back_populates="characters")


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    dm_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    party_id: Mapped[int | None] = mapped_column(ForeignKey("parties.id", ondelete="SET NULL"), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(150), index=True)
    theme: Mapped[str] = mapped_column(String(80), default="High Fantasy")
    setting_name: Mapped[str] = mapped_column(String(120), default="Homebrew Realm")
    summary: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(40), default="draft")
    campaign_data: Mapped[dict] = mapped_column(JSONB, default=dict)

    owner: Mapped[User] = relationship(back_populates="campaigns", foreign_keys=[owner_id])
    dm_user: Mapped[User] = relationship(back_populates="dm_campaigns", foreign_keys=[dm_user_id])
    party: Mapped[Party | None] = relationship(back_populates="campaigns")



class MapProject(Base, TimestampMixin):
    __tablename__ = "map_projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(150), index=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    map_data: Mapped[dict] = mapped_column(JSONB, default=dict)

    owner: Mapped[User] = relationship(back_populates="map_projects")


class ForumThread(Base, TimestampMixin):
    __tablename__ = "forum_threads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    topic: Mapped[str] = mapped_column(String(80), default="general")
    body: Mapped[str] = mapped_column(Text)

    author: Mapped[User] = relationship(back_populates="threads")
    posts: Mapped[list[ForumPost]] = relationship(back_populates="thread", cascade="all, delete-orphan")


class ForumPost(Base, TimestampMixin):
    __tablename__ = "forum_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("forum_threads.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    body: Mapped[str] = mapped_column(Text)

    thread: Mapped[ForumThread] = relationship(back_populates="posts")
    author: Mapped[User] = relationship(back_populates="posts")


class PartyAuditLog(Base):
    __tablename__ = "party_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(40), index=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    party: Mapped[Party] = relationship(back_populates="audit_logs")
    actor: Mapped[User | None] = relationship(back_populates="party_audit_logs", foreign_keys=[actor_id])


class MaintenanceAgentRun(Base):
    __tablename__ = "maintenance_agent_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pass", index=True)
    summary: Mapped[str] = mapped_column(String(255), default="")
    checks_run: Mapped[int] = mapped_column(Integer, default=0)
    checks_passed: Mapped[int] = mapped_column(Integer, default=0)
    checks_warned: Mapped[int] = mapped_column(Integer, default=0)
    checks_failed: Mapped[int] = mapped_column(Integer, default=0)
    findings: Mapped[list] = mapped_column(JSONB, default=list)
    optimization_suggestions: Mapped[list] = mapped_column(JSONB, default=list)
    report_markdown: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    created_by: Mapped[User | None] = relationship(back_populates="maintenance_runs", foreign_keys=[created_by_user_id])


class PartyAuditLogArchive(Base):
    __tablename__ = "party_audit_logs_archive"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    original_log_id: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    party_id: Mapped[int] = mapped_column(ForeignKey("parties.id", ondelete="CASCADE"), index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity_type: Mapped[str] = mapped_column(String(40), index=True)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    archived_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    party: Mapped[Party] = relationship(back_populates="archived_audit_logs")
    actor: Mapped[User | None] = relationship(foreign_keys=[actor_id])


class ReferenceMaterial(Base, TimestampMixin):
    __tablename__ = "reference_materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_key: Mapped[str] = mapped_column(String(80), index=True)
    source_name: Mapped[str] = mapped_column(String(120), index=True)
    license_name: Mapped[str] = mapped_column(String(120), default="")
    source_url: Mapped[str] = mapped_column(String(500), default="")
    category: Mapped[str] = mapped_column(String(40), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    edition: Mapped[str] = mapped_column(String(20), default="5e")
    summary: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list] = mapped_column(JSONB, default=list)
    content: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_open_content: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_import_enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class SourceRegistry(Base, TimestampMixin):
    __tablename__ = "source_registry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), index=True)
    base_url: Mapped[str] = mapped_column(String(500), default="")
    license_name: Mapped[str] = mapped_column(String(120), default="")
    trust_level: Mapped[str] = mapped_column(String(20), default="review")
    is_official: Mapped[bool] = mapped_column(Boolean, default=False)
    is_open_content: Mapped[bool] = mapped_column(Boolean, default=False)
    is_import_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    import_notes: Mapped[str] = mapped_column(Text, default="")
    source_metadata: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
