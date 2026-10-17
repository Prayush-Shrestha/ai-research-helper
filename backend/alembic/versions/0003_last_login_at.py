"""Record when each user last signed in (admin console visibility)."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003_last_login_at"
down_revision = "0002_user_role"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite can't ALTER a column in place, so batch it.
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("last_login_at")
