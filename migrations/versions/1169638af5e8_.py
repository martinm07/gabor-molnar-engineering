"""empty message

Revision ID: 1169638af5e8
Revises: 8584710c7a7c
Create Date: 2024-09-07 11:40:13.361898

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1169638af5e8"
down_revision = "8584710c7a7c"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "params",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=128), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_params_id"),
    )
    op.create_table(
        "savedcomponentdiffs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("version", sa.String(length=256), nullable=False),
        sa.Column("next_version", sa.String(length=256), nullable=True),
        sa.Column("diff", sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_savedcomponentdiffs_id"),
    )
    op.create_table(
        "savedcomponentlibraries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_savedcomponentlibraries_id"),
    )
    op.create_table(
        "savedcomponenttags",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_savedcomponenttags_id"),
    )
    op.create_table(
        "savedcomponents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("parts", sa.String(length=1024), nullable=False),
        sa.Column("library_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["library_id"],
            ["savedcomponentlibraries.id"],
            name="fk_savedcomponents_library_id",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_savedcomponents_id"),
    )
    op.create_table(
        "component_tag_association_table",
        sa.Column("component_id", sa.Integer(), nullable=True),
        sa.Column("tag_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["component_id"],
            ["savedcomponents.id"],
            name="fk_component_tag_association_table_component_id",
        ),
        sa.ForeignKeyConstraint(
            ["tag_id"],
            ["savedcomponenttags.id"],
            name="fk_component_tag_association_table_tag_id",
        ),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("component_tag_association_table")
    op.drop_table("savedcomponents")
    op.drop_table("savedcomponenttags")
    op.drop_table("savedcomponentlibraries")
    op.drop_table("savedcomponentdiffs")
    op.drop_table("params")
    # ### end Alembic commands ###