"""add question_type column to skill_questions

Revision ID: 005
Revises: 004
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add question_type column to skill_questions table
    op.add_column('skill_questions', sa.Column('question_type', sa.String(length=50), nullable=False, server_default=sa.text("'multiple_choice'")))


def downgrade() -> None:
    # Remove question_type column from skill_questions table
    op.drop_column('skill_questions', 'question_type')
