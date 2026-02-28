"""Add blockchain fields to certificates table

Revision ID: 009
Revises: 008
Create Date: 2024-01-15
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    # Add blockchain anchoring fields
    op.add_column('certificates', sa.Column('blockchain_network', sa.String(50), nullable=True))
    op.add_column('certificates', sa.Column('blockchain_tx_id', sa.String(100), nullable=True))
    op.add_column('certificates', sa.Column('blockchain_hash', sa.String(64), nullable=True))
    op.add_column('certificates', sa.Column('blockchain_anchored_at', sa.DateTime(), nullable=True))
    op.add_column('certificates', sa.Column('hash_algorithm', sa.String(20), nullable=True, server_default='SHA-256'))
    
    # Create indexes for blockchain fields
    op.create_index('idx_certificate_blockchain_tx', 'certificates', ['blockchain_tx_id'], unique=False)
    op.create_index('idx_certificate_blockchain_hash', 'certificates', ['blockchain_hash'], unique=False)


def downgrade():
    op.drop_index('idx_certificate_blockchain_hash', table_name='certificates')
    op.drop_index('idx_certificate_blockchain_tx', table_name='certificates')
    op.drop_column('certificates', 'hash_algorithm')
    op.drop_column('certificates', 'blockchain_anchored_at')
    op.drop_column('certificates', 'blockchain_hash')
    op.drop_column('certificates', 'blockchain_tx_id')
    op.drop_column('certificates', 'blockchain_network')
