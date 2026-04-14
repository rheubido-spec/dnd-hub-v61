"""maintenance agent runs

Revision ID: 20260409_0004
Revises: 20260409_0003
Create Date: 2026-04-09 12:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = '20260409_0004'
down_revision = '20260409_0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'maintenance_agent_runs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_by_user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pass'),
        sa.Column('summary', sa.String(length=255), nullable=False, server_default=''),
        sa.Column('checks_run', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('checks_passed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('checks_warned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('checks_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('findings', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('optimization_suggestions', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('report_markdown', sa.Text(), nullable=False, server_default=''),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_maintenance_agent_runs_id', 'maintenance_agent_runs', ['id'])
    op.create_index('ix_maintenance_agent_runs_created_by_user_id', 'maintenance_agent_runs', ['created_by_user_id'])
    op.create_index('ix_maintenance_agent_runs_status', 'maintenance_agent_runs', ['status'])
    op.create_index('ix_maintenance_agent_runs_created_at', 'maintenance_agent_runs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_maintenance_agent_runs_created_at', table_name='maintenance_agent_runs')
    op.drop_index('ix_maintenance_agent_runs_status', table_name='maintenance_agent_runs')
    op.drop_index('ix_maintenance_agent_runs_created_by_user_id', table_name='maintenance_agent_runs')
    op.drop_index('ix_maintenance_agent_runs_id', table_name='maintenance_agent_runs')
    op.drop_table('maintenance_agent_runs')
