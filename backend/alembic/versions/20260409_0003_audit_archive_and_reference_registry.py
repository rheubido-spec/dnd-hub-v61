
"""audit archive and reference registry

Revision ID: 20260409_0003
Revises: 20260409_0002
Create Date: 2026-04-09 12:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '20260409_0003'
down_revision = '20260409_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'party_audit_logs_archive',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('original_log_id', sa.Integer(), nullable=False),
        sa.Column('party_id', sa.Integer(), sa.ForeignKey('parties.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=80), nullable=False),
        sa.Column('entity_type', sa.String(length=40), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_party_audit_logs_archive_original_log_id', 'party_audit_logs_archive', ['original_log_id'], unique=True)
    op.create_index('ix_party_audit_logs_archive_party_id', 'party_audit_logs_archive', ['party_id'], unique=False)
    op.create_index('ix_party_audit_logs_archive_actor_id', 'party_audit_logs_archive', ['actor_id'], unique=False)
    op.create_index('ix_party_audit_logs_archive_created_at', 'party_audit_logs_archive', ['created_at'], unique=False)
    op.create_index('ix_party_audit_logs_archive_archived_at', 'party_audit_logs_archive', ['archived_at'], unique=False)

    op.create_table(
        'reference_materials',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('source_key', sa.String(length=80), nullable=False),
        sa.Column('source_name', sa.String(length=120), nullable=False),
        sa.Column('license_name', sa.String(length=120), nullable=False, server_default=''),
        sa.Column('source_url', sa.String(length=500), nullable=False, server_default=''),
        sa.Column('category', sa.String(length=40), nullable=False),
        sa.Column('name', sa.String(length=160), nullable=False),
        sa.Column('slug', sa.String(length=180), nullable=False),
        sa.Column('edition', sa.String(length=20), nullable=False, server_default='5e'),
        sa.Column('summary', sa.Text(), nullable=False, server_default=''),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('content', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('is_open_content', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_import_enabled', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_reference_materials_source_key', 'reference_materials', ['source_key'], unique=False)
    op.create_index('ix_reference_materials_category', 'reference_materials', ['category'], unique=False)
    op.create_index('ix_reference_materials_name', 'reference_materials', ['name'], unique=False)
    op.create_index('ix_reference_materials_slug', 'reference_materials', ['slug'], unique=True)
    op.create_index('ix_reference_materials_is_open_content', 'reference_materials', ['is_open_content'], unique=False)
    op.create_index('ix_reference_materials_is_import_enabled', 'reference_materials', ['is_import_enabled'], unique=False)

    op.create_table(
        'source_registry',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('source_key', sa.String(length=80), nullable=False),
        sa.Column('display_name', sa.String(length=120), nullable=False),
        sa.Column('base_url', sa.String(length=500), nullable=False, server_default=''),
        sa.Column('license_name', sa.String(length=120), nullable=False, server_default=''),
        sa.Column('trust_level', sa.String(length=20), nullable=False, server_default='review'),
        sa.Column('is_official', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_open_content', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_import_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('import_notes', sa.Text(), nullable=False, server_default=''),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_source_registry_source_key', 'source_registry', ['source_key'], unique=True)
    op.create_index('ix_source_registry_display_name', 'source_registry', ['display_name'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_source_registry_display_name', table_name='source_registry')
    op.drop_index('ix_source_registry_source_key', table_name='source_registry')
    op.drop_table('source_registry')

    op.drop_index('ix_reference_materials_is_import_enabled', table_name='reference_materials')
    op.drop_index('ix_reference_materials_is_open_content', table_name='reference_materials')
    op.drop_index('ix_reference_materials_slug', table_name='reference_materials')
    op.drop_index('ix_reference_materials_name', table_name='reference_materials')
    op.drop_index('ix_reference_materials_category', table_name='reference_materials')
    op.drop_index('ix_reference_materials_source_key', table_name='reference_materials')
    op.drop_table('reference_materials')

    op.drop_index('ix_party_audit_logs_archive_archived_at', table_name='party_audit_logs_archive')
    op.drop_index('ix_party_audit_logs_archive_created_at', table_name='party_audit_logs_archive')
    op.drop_index('ix_party_audit_logs_archive_actor_id', table_name='party_audit_logs_archive')
    op.drop_index('ix_party_audit_logs_archive_party_id', table_name='party_audit_logs_archive')
    op.drop_index('ix_party_audit_logs_archive_original_log_id', table_name='party_audit_logs_archive')
    op.drop_table('party_audit_logs_archive')
