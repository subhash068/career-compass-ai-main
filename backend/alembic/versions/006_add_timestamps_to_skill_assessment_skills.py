"""Add created_at and updated_at to skill_assessment_skills

Revision ID: 006
Revises: 005
Create Date: 2024-01-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Add created_at column
    op.add_column(
        'skill_assessment_skills',
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP")
        )
    )
    
    # Add updated_at column
    op.add_column(
        'skill_assessment_skills',
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False,
            server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
        )
    )


def downgrade():
    op.drop_column('skill_assessment_skills', 'updated_at')
    op.drop_column('skill_assessment_skills', 'created_at')
