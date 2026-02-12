"""add missing timestamps to user_skills, domains, and skill_questions

Revision ID: 003
Revises: 002
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add created_at and updated_at to user_skills table
    op.add_column('user_skills', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('user_skills', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')))

    # Add created_at and updated_at to domains table
    op.add_column('domains', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('domains', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')))

    # Add created_at and updated_at to skill_questions table
    op.add_column('skill_questions', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('skill_questions', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')))


def downgrade() -> None:
    # Remove created_at and updated_at from user_skills table
    op.drop_column('user_skills', 'created_at')
    op.drop_column('user_skills', 'updated_at')

    # Remove created_at and updated_at from domains table
    op.drop_column('domains', 'created_at')
    op.drop_column('domains', 'updated_at')

    # Remove created_at and updated_at from skill_questions table
    op.drop_column('skill_questions', 'created_at')
    op.drop_column('skill_questions', 'updated_at')
