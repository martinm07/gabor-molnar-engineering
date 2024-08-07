"""empty message

Revision ID: 2de73f21041e
Revises: 81f8741d9424
Create Date: 2024-07-06 20:38:51.693574

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2de73f21041e"
down_revision = "81f8741d9424"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "blogfeedbacks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("blog_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.ForeignKeyConstraint(
            ["blog_id"], ["blogs.id"], name="fk_blogfeedbacks_blog_id"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_blogfeedbacks_id"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("blogfeedbacks")
    # ### end Alembic commands ###
