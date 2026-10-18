"""Tests for the embedding service (local provider, no API keys needed)."""

from __future__ import annotations

import asyncio

from app.services.embedding import EmbeddingService, EmbeddingServiceConfig


def test_local_embedding_service_dimension():
    svc = EmbeddingService(
        EmbeddingServiceConfig(
            provider="local",
            model="local-simhash-v1",
            api_key=None,
            base_url="http://localhost",
            timeout=10.0,
        )
    )
    assert svc.dimension() == 384
    assert svc.model_name() == "local-simhash-v1"


def test_local_embedding_service_embed_texts():
    svc = EmbeddingService(
        EmbeddingServiceConfig(
            provider="local",
            model="local-simhash-v1",
            api_key=None,
            base_url="http://localhost",
            timeout=10.0,
        )
    )
    vectors = asyncio.run(svc.embed_texts(["hello world", "goodbye world"]))
    assert len(vectors) == 2
    assert len(vectors[0]) == 384
    assert len(vectors[1]) == 384
    # Same text should produce same vector
    vectors_again = asyncio.run(svc.embed_texts(["hello world"]))
    assert vectors_again[0] == vectors[0]


def test_local_embedding_service_empty_text():
    svc = EmbeddingService(
        EmbeddingServiceConfig(
            provider="local",
            model="local-simhash-v1",
            api_key=None,
            base_url="http://localhost",
            timeout=10.0,
        )
    )
    vectors = asyncio.run(svc.embed_texts(["", "   ", "real text"]))
    assert len(vectors) == 3
    assert all(len(v) == 384 for v in vectors)
    # Empty strings should be zero vectors
    assert vectors[0] == [0.0] * 384
    assert vectors[1] == [0.0] * 384
    assert vectors[2] != [0.0] * 384
