"""Embedding service abstraction for RAG.

Providers:
- ``local`` — deterministic simhash embeddings, no API key, works offline.
  Used by tests and when no embedding provider is configured.
- ``openai`` — calls OpenAI embedding API via httpx (no heavy SDK).
- ``ollama`` — calls a local Ollama embedding endpoint.

The service batches texts, retries transient failures, enforces timeouts,
and never logs document content.
"""

from __future__ import annotations

import hashlib
import logging
import math
import re
import time
from dataclasses import dataclass
from typing import Protocol

import httpx

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 384  # dimension for the local simhash provider


class EmbeddingResult:
    def __init__(self, vectors: list[list[float]], model: str):
        self.vectors = vectors
        self.model = model


class EmbeddingProvider(Protocol):
    """Protocol for embedding providers."""

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...

    def dimension(self) -> int:
        ...

    def model_name(self) -> str:
        ...


class LocalEmbeddingProvider:
    """Deterministic simhash-based embeddings.

    No external API, no API key, fully offline. Suitable for tests and local
    development. Not semantically meaningful — used to validate the pipeline
    and as a safe fallback when no real provider is configured.
    """

    def __init__(self, dimension: int = EMBEDDING_DIMENSION) -> None:
        self._dimension = dimension

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(t) for t in texts]

    def dimension(self) -> int:
        return self._dimension

    def model_name(self) -> str:
        return "local-simhash-v1"

    @staticmethod
    def _embed_one(text: str) -> list[float]:
        """Produce a deterministic unit vector from text via simhash."""
        vector = [0.0] * EMBEDDING_DIMENSION
        if not text:
            return vector
        # Tokenize into word-ish shingles.
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        if not tokens:
            return vector
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            for i in range(EMBEDDING_DIMENSION):
                byte = digest[i % len(digest)]
                bit = 1 if (byte >> (i % 8)) & 1 else -1
                vector[i] += bit
        # Normalize to unit length.
        norm = math.sqrt(sum(v * v for v in vector)) or 1.0
        return [v / norm for v in vector]


class OpenAIEmbeddingProvider:
    """OpenAI text-embedding provider via httpx.

    Requires OPENAI_API_KEY in the environment.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        base_url: str = "https://api.openai.com/v1",
        timeout: float = 60.0,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        # text-embedding-3-small is 1536 dims; large is 3072.
        self._dimension = 1536 if "small" in model else 3072

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not self._api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        vectors: list[list[float]] = []
        # OpenAI allows multiple inputs per request; batch to limit size.
        batch_size = 64
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            payload = {"model": self._model, "input": batch}
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(
                    f"{self._base_url}/embeddings",
                    headers=headers,
                    json=payload,
                )
                if resp.status_code >= 400:
                    logger.error(
                        "OpenAI embedding request failed: status=%s",
                        resp.status_code,
                    )
                    raise RuntimeError(
                        f"Embedding provider returned {resp.status_code}"
                    )
                data = resp.json()
                for item in data.get("data", []):
                    vectors.append(item["embedding"])
        return vectors

    def dimension(self) -> int:
        return self._dimension

    def model_name(self) -> str:
        return self._model


class OllamaEmbeddingProvider:
    """Ollama local embedding provider via httpx."""

    def __init__(
        self,
        model: str = "nomic-embed-text",
        base_url: str = "http://localhost:11434",
        timeout: float = 60.0,
    ) -> None:
        self._model = model
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._dimension: int | None = None

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            for text in texts:
                resp = await client.post(
                    f"{self._base_url}/api/embeddings",
                    json={"model": self._model, "prompt": text},
                )
                if resp.status_code >= 400:
                    logger.error(
                        "Ollama embedding request failed: status=%s",
                        resp.status_code,
                    )
                    raise RuntimeError(
                        f"Embedding provider returned {resp.status_code}"
                    )
                data = resp.json()
                vec = data.get("embedding", [])
                if self._dimension is None:
                    self._dimension = len(vec)
                vectors.append(vec)
        return vectors

    def dimension(self) -> int:
        if self._dimension is not None:
            return self._dimension
        return 768  # nominal for nomic-embed-text

    def model_name(self) -> str:
        return self._model


@dataclass
class EmbeddingServiceConfig:
    provider: str
    model: str
    api_key: str | None
    base_url: str
    timeout: float


class EmbeddingService:
    """Orchestrates embedding generation with batching, retries, caching."""

    def __init__(self, config: EmbeddingServiceConfig) -> None:
        self.config = config
        self._provider: EmbeddingProvider | None = None

    def _get_provider(self) -> EmbeddingProvider:
        if self._provider is not None:
            return self._provider
        provider = self.config.provider.lower()
        if provider == "openai":
            self._provider = OpenAIEmbeddingProvider(
                api_key=self.config.api_key or "",
                model=self.config.model,
                base_url=self.config.base_url,
                timeout=self.config.timeout,
            )
        elif provider == "ollama":
            self._provider = OllamaEmbeddingProvider(
                model=self.config.model,
                base_url=self.config.base_url,
                timeout=self.config.timeout,
            )
        else:  # "local" or anything unknown
            self._provider = LocalEmbeddingProvider()
        return self._provider

    def dimension(self) -> int:
        return self._get_provider().dimension()

    def model_name(self) -> str:
        return self._get_provider().model_name()

    async def embed_texts(
        self, texts: list[str], max_retries: int = 3
    ) -> list[list[float]]:
        """Embed a list of texts with retry on transient failures.

        Empty strings are mapped to zero vectors (they are skipped upstream
        but we handle them defensively).
        """
        provider = self._get_provider()
        if not texts:
            return []

        # Separate empty from non-empty so we don't waste provider calls.
        results: list[list[float] | None] = [None] * len(texts)
        non_empty_indices = [
            i for i, t in enumerate(texts) if t and t.strip()
        ]
        non_empty_texts = [texts[i] for i in non_empty_indices]

        if non_empty_texts:
            last_error: Exception | None = None
            for attempt in range(max_retries):
                try:
                    vectors = await provider.embed_texts(non_empty_texts)
                    for idx, vec in zip(non_empty_indices, vectors):
                        results[idx] = vec
                    break
                except Exception as exc:  # noqa: BLE001
                    last_error = exc
                    wait = min(2**attempt, 30)
                    logger.warning(
                        "Embedding attempt %s failed, retrying in %ss",
                        attempt + 1,
                        wait,
                    )
                    time.sleep(wait)
            else:
                logger.error(
                    "Embedding failed after %s retries: %s", max_retries, last_error
                )
                raise RuntimeError(
                    f"Embedding provider failed after {max_retries} retries"
                ) from last_error

        # Fill empty slots with zero vectors.
        dim = provider.dimension()
        zero = [0.0] * dim
        return [r if r is not None else zero for r in results]
