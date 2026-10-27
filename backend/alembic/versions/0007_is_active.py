"""Add is_active column to users so admins can disable/reactivate accounts.

Disabled accounts cannot authenticate (login returns 401, every authenticated
request returns 401). Defaults to true for new and existing accounts.

On SQLite this runs in batch mode (ALTER TABLE with constraints is not
supported in place). On PostgreSQL it's a plain ADD COLUMN.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0007_is_active"
down_revision = "0006_phase3_core"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            )
        )


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("is_active")
