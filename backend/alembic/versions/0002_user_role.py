"""Add the user role column ("user" by default, "admin" for the console)."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_user_role"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Batch mode: SQLite recreates the table (it can't ALTER in constraints).
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column(
                "role", sa.String(10), nullable=False, server_default="user"
            )
        )
        batch.create_check_constraint(
            "ck_users_role", "role IN ('user', 'admin')"
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_constraint("ck_users_role", type_="check")
        batch.drop_column("role")
