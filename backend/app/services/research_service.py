"""Research topic suggestion service.

Takes a free-form description of what a user wants to research and returns
a few concrete topic suggestions, flagging which one is the best fit.
This is a local, rule-based helper (no external AI needed) so it works
offline and stays predictable.
"""

from __future__ import annotations

import re
from typing import Any

from app.schemas.research import SuggestTopicsOut, TopicSuggestion

# Simple keyword -> topic mapping. Kept small and readable so it's easy to
# extend later without touching any AI service.
_KEYWORD_TOPICS = [
    {
        "keywords": ["machine learning", "ml", "deep learning", "neural", "ai", "artificial intelligence"],
        "title": "Machine Learning Applications",
        "description": "Explore how ML models solve real-world problems in your area of interest.",
        "why_it_fits": "Matches AI/ML keywords in your description.",
        "suggested_approach": "Start with a public dataset, train a baseline model, then iterate.",
    },
    {
        "keywords": ["climate", "environment", "carbon", "sustainability", "green", "emission"],
        "title": "Climate & Environmental Impact",
        "description": "Study how environmental factors affect systems and what can be done about them.",
        "why_it_fits": "Matches climate/environment keywords in your description.",
        "suggested_approach": "Gather environmental data, identify trends, and model potential interventions.",
    },
    {
        "keywords": ["health", "medical", "medicine", "disease", "patient", "hospital", "clinical"],
        "title": "Healthcare & Medical Research",
        "description": "Investigate health outcomes, treatments, or medical patterns in a population.",
        "why_it_fits": "Matches health/medical keywords in your description.",
        "suggested_approach": "Use anonymized patient data, compare outcomes, and look for statistically significant patterns.",
    },
    {
        "keywords": ["education", "learning", "student", "school", "university", "teaching", "pedagogy"],
        "title": "Education & Learning Outcomes",
        "description": "Examine how people learn and what improves educational results.",
        "why_it_fits": "Matches education/learning keywords in your description.",
        "suggested_approach": "Collect performance data, compare teaching methods, and measure improvement.",
    },
    {
        "keywords": ["finance", "money", "investment", "stock", "crypto", "trading", "economic"],
        "title": "Finance & Economic Trends",
        "description": "Analyze financial data to understand markets, investments, or economic behavior.",
        "why_it_fits": "Matches finance/economic keywords in your description.",
        "suggested_approach": "Pull market data, backtest strategies, and look for predictive signals.",
    },
    {
        "keywords": ["social", "society", "community", "behavior", "psychology", "human", "culture"],
        "title": "Social Behavior & Society",
        "description": "Study how people behave individually and in groups within a social context.",
        "why_it_fits": "Matches social/behavioral keywords in your description.",
        "suggested_approach": "Design a survey or observational study, then analyze responses for patterns.",
    },
    {
        "keywords": ["cyber", "security", "privacy", "encryption", "hack", "network", "blockchain"],
        "title": "Cybersecurity & Privacy",
        "description": "Examine how systems stay secure, where vulnerabilities appear, and how to protect data.",
        "why_it_fits": "Matches security/privacy keywords in your description.",
        "suggested_approach": "Audit a system for weaknesses, test defenses, and document findings responsibly.",
    },
]


def _score_topic(text: str, keywords: list[str]) -> int:
    """Count how many keywords appear in the text (case-insensitive)."""
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw in text_lower)


def suggest_topics(description: str) -> SuggestTopicsOut:
    """Return topic suggestions for a research description.

    The best topic is the one whose keywords match most strongly. When
    nothing matches, a general-purpose suggestion is offered.
    """
    text = description.strip()
    matches: list[tuple[int, dict[str, Any]]] = []

    for topic in _KEYWORD_TOPICS:
        score = _score_topic(text, topic["keywords"])
        if score > 0:
            matches.append((score, topic))

    # Sort by score descending, then keep original order for ties.
    matches.sort(key=lambda m: m[0], reverse=True)

    topics: list[TopicSuggestion] = []
    best_index: int | None = None

    if matches:
        for i, (score, topic) in enumerate(matches[:5]):
            is_best = i == 0
            if is_best:
                best_index = i
            topics.append(
                TopicSuggestion(
                    title=topic["title"],
                    description=topic["description"],
                    why_it_fits=topic["why_it_fits"],
                    suggested_approach=topic["suggested_approach"],
                    is_best=is_best,
                )
            )
        note = (
            f"Based on your description, topic #{best_index + 1} looks like the best fit "
            f"because it matched the most keywords from what you wrote."
        )
    else:
        # Fallback: generic suggestion when nothing matched.
        topics.append(
            TopicSuggestion(
                title="General Research Exploration",
                description="Broad topic shaped around the description you provided.",
                why_it_fits="No specific keywords matched, so this is a flexible starting point.",
                suggested_approach="Narrow your description further, then re-run for more targeted suggestions.",
                is_best=True,
            )
        )
        best_index = 0
        note = "No specific keywords matched, so here's a general starting point — try adding more detail to your description."

    return SuggestTopicsOut(topics=topics, best_topic_index=best_index, note=note)
