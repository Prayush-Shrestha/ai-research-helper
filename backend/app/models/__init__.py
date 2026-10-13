"""Import every model here so Base.metadata covers the whole schema."""

from app.models.document import Document  # noqa: F401
from app.models.note import ResearchNote  # noqa: F401
from app.models.user import User  # noqa: F401
