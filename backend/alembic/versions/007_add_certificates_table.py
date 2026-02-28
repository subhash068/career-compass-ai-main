"""Add certificates table

Revision ID: 007
Revises: 006
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'certificates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('learning_path_id', sa.Integer(), nullable=False),
        sa.Column('role_title', sa.String(length=255), nullable=False),
        sa.Column('user_name', sa.String(length=255), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('certificate_url', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['learning_path_id'], ['learning_paths.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_certificate_user_id', 'certificates', ['user_id'])
    op.create_index('idx_certificate_learning_path_id', 'certificates', ['learning_path_id'])
    op.create_index('idx_certificate_issued_at', 'certificates', ['issued_at'])


def downgrade() -> None:
    op.drop_index('idx_certificate_issued_at', table_name='certificates')
    op.drop_index('idx_certificate_learning_path_id', table_name='certificates')
    op.drop_index('idx_certificate_user_id', table_name='certificates')
    op.drop_table('certificates')
