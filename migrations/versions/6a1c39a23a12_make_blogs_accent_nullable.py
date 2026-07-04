"""Make blogs.accent nullable

Revision ID: 6a1c39a23a12
Revises: 53f06b1d7a36
Create Date: 2026-07-04 01:58:10.995961

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = "6a1c39a23a12"
down_revision = "53f06b1d7a36"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("blogs", schema=None) as batch_op:
        batch_op.alter_column(
            "accent", existing_type=mysql.VARCHAR(length=11), nullable=True
        )


def downgrade():
    with op.batch_alter_table("blogs", schema=None) as batch_op:
        batch_op.alter_column(
            "accent", existing_type=mysql.VARCHAR(length=11), nullable=False
        )
