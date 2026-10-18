"""Tests for the JSON vector store (no pgvector dependency needed)."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

from app.core.config import Settings
from app.services.vector_store import JsonVectorStore, _cosine_similarity


def test_cosine_similarity():
    assert abs(_cosine_similarity([1.0, 0.0], [1.0, 0.0]) - 1.0) < 1e-9
    assert abs(_cosine_similarity([1.0, 0.0], [0.0, 1.0]) - 0.0) < 1e-9
    assert _cosine_similarity([], []) == 0.0


def _make_mock_db(chunks_by_id: dict) -> MagicMock:
    """Build a mock DB session that supports .get() and .execute()."""
    db = MagicMock()

    def get(model, chunk_id):
        if chunk_id in chunks_by_id:
            c = MagicMock()
            c.id = chunk_id
            c.embedding_vector = chunks_by_id[chunk_id][0]
            c.text = chunks_by_id[chunk_id][1]
            c.page_number = chunks_by_id[chunk_id][2]
            return c
        return None

    db.get.side_effect = get

    def execute(stmt):
        # Return all matching chunks for similarity search
        result = MagicMock()
        rows = []
        for chunk_id, (vector_json, text, page_number) in chunks_by_id.items():
            row = MagicMock()
            # Make the row unpackable into (id, vector_json, text, page_number)
            row.__iter__ = lambda self, _cid=chunk_id, _vj=vector_json, _t=text, _pn=page_number: iter(
                [_cid, _vj, _t, _pn]
            )
            row.__len__ = lambda self: 4
            rows.append(row)
        result.all.return_value = rows
        return result

    db.execute.side_effect = execute
    return db


def test_vector_store_upsert_and_search():
    svc = JsonVectorStore(Settings())
    chunks_by_id = {}

    async def run():
        await svc.upsert_chunks(
            _make_mock_db(chunks_by_id),
            [
                ("chunk-1", '[0.1, 0.0, 0.0]', [0.1, 0.0, 0.0]),
                ("chunk-2", '[0.0, 1.0, 0.0]', [0.0, 1.0, 0.0]),
            ],
        )
        # Update the mock db's chunks dict after upsert
        chunks_by_id["chunk-1"] = ('[0.1, 0.0, 0.0]', "text one", None)
        chunks_by_id["chunk-2"] = ('[0.0, 1.0, 0.0]', "text two", None)

        results = await svc.similarity_search(
            _make_mock_db(chunks_by_id),
            query_vector=[1.0, 0.0, 0.0],
            top_k=5,
            threshold=0.0,
        )
        assert len(results) == 2
        assert results[0][0] == "chunk-1"
        assert results[0][1] > results[1][1]

    asyncio.run(run())


def test_vector_store_threshold_filtering():
    svc = JsonVectorStore(Settings())
    chunks_by_id = {}

    async def run():
        await svc.upsert_chunks(
            _make_mock_db(chunks_by_id),
            [
                ("chunk-1", '[1.0, 0.0]', [1.0, 0.0]),
                ("chunk-2", '[0.0, 1.0]', [0.0, 1.0]),
            ],
        )
        chunks_by_id["chunk-1"] = ('[1.0, 0.0]', "text one", None)
        chunks_by_id["chunk-2"] = ('[0.0, 1.0]', "text two", None)

        results = await svc.similarity_search(
            _make_mock_db(chunks_by_id),
            query_vector=[1.0, 0.0],
            top_k=5,
            threshold=0.5,
        )
        assert len(results) == 1
        assert results[0][0] == "chunk-1"

    asyncio.run(run())
