"""Enhance certificates table with new fields

Revision ID: 008
Revises: 007
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to certificates table
    op.add_column('certificates', sa.Column('certificate_unique_id', sa.String(50), nullable=True))
    op.add_column('certificates', sa.Column('expiry_date', sa.DateTime(), nullable=True))
    op.add_column('certificates', sa.Column('course_duration', sa.String(100), nullable=True))
    op.add_column('certificates', sa.Column('completion_mode', sa.String(100), nullable=True))
    op.add_column('certificates', sa.Column('skills_covered', sa.Text(), nullable=True))
    op.add_column('certificates', sa.Column('final_assessment_score', sa.Float(), nullable=True))
    op.add_column('certificates', sa.Column('performance_grade', sa.String(10), nullable=True))
    op.add_column('certificates', sa.Column('project_completed', sa.Boolean(), nullable=True, server_default='0'))
    op.add_column('certificates', sa.Column('certificate_hash', sa.String(64), nullable=True))
    op.add_column('certificates', sa.Column('verification_url', sa.String(500), nullable=True))
    op.add_column('certificates', sa.Column('qr_code', sa.Text(), nullable=True))
    op.add_column('certificates', sa.Column('digital_signature', sa.String(256), nullable=True))
    
    # Create unique index on certificate_unique_id
    op.create_index('idx_certificate_unique_id', 'certificates', ['certificate_unique_id'], unique=True)


def downgrade():
    op.drop_index('idx_certificate_unique_id', table_name='certificates')
    op.drop_column('certificates', 'digital_signature')
    op.drop_column('certificates', 'qr_code')
    op.drop_column('certificates', 'verification_url')
    op.drop_column('certificates', 'certificate_hash')
    op.drop_column('certificates', 'project_completed')
    op.drop_column('certificates', 'performance_grade')
    op.drop_column('certificates', 'final_assessment_score')
    op.drop_column('certificates', 'skills_covered')
    op.drop_column('certificates', 'completion_mode')
    op.drop_column('certificates', 'course_duration')
    op.drop_column('certificates', 'expiry_date')
    op.drop_column('certificates', 'certificate_unique_id')
