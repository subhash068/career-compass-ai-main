"""add explanation column to skill_questions

Revision ID: 004
Revises: 003
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add explanation column to skill_questions table
    op.add_column('skill_questions', sa.Column('explanation', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove explanation column from skill_questions table
    op.drop_column('skill_questions', 'explanation')
