"""Research topic suggestion schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class SuggestTopicsIn(BaseModel):
    """User describes what they want to research."""

    description: str = Field(
        min_length=10,
        max_length=2000,
        description="What you're interested in researching.",
    )


class TopicSuggestion(BaseModel):
    """One suggested research topic."""

    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=500)
    why_it_fits: str = Field(..., max_length=300)
    suggested_approach: str = Field(..., max_length=300)
    is_best: bool = False


class SuggestTopicsOut(BaseModel):
    """Response with suggested topics and a best pick."""

    topics: list[TopicSuggestion]
    best_topic_index: int | None = None
    note: str | None = None
