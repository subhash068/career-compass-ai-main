"""add written_assessment column to skill_assessment_skills

Revision ID: 002
Revises: 001
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add written_assessment column to skill_assessment_skills table
    op.add_column('skill_assessment_skills', sa.Column('written_assessment', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove written_assessment column from skill_assessment_skills table
    op.drop_column('skill_assessment_skills', 'written_assessment')
