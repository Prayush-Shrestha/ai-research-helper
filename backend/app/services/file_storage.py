"""Private file storage behind a small interface.

Phase 1 stores uploads on local disk, outside any publicly served
directory. A future object-storage backend only needs to implement
the same StorageService protocol.
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import BinaryIO, Protocol


class StorageService(Protocol):
    def save(self, stream: BinaryIO, suffix: str) -> str:
        """Persist stream bytes, return the internal storage key."""
        ...

    def delete(self, storage_key: str) -> None:
        ...

    def open(self, storage_key: str) -> BinaryIO:
        ...


class LocalFileStorage:
    """UUID filenames inside a root directory (no user input in paths)."""

    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _resolve(self, storage_key: str) -> Path:
        # The key is always "<hex><ext>" minted by save(); anything else is
        # rejected so callers can never escape the storage root.
        name = Path(storage_key).name
        if not name or name != storage_key or len(name) > 128:
            raise ValueError("Invalid storage key")
        return self.root / name

    def save(self, stream: BinaryIO, suffix: str) -> str:
        key = f"{uuid.uuid4().hex}{suffix.lower()}"
        target = self._resolve(key)
        with target.open("wb") as out:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                out.write(chunk)
        return key

    def delete(self, storage_key: str) -> None:
        try:
            self._resolve(storage_key).unlink(missing_ok=True)
        except ValueError:
            pass

    def open(self, storage_key: str) -> BinaryIO:
        return self._resolve(storage_key).open("rb")
