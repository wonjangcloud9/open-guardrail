"""Detect RAG chunk metadata or separators leaking into output."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_SEPARATORS = [
    "---", "===", "###END###",
    "Document:", "Chunk:", "Source:",
    "<|endoftext|>", "[SEP]", "<<CONTEXT>>",
    "metadata:", "chunk_id:", "embedding:",
    "score:", "relevance_score:",
    "\n---\n", "Retrieved from:", "passage_id:",
]


class _ChunkBoundaryLeak:
    def __init__(
        self,
        *,
        action: str = "warn",
        custom_separators: Optional[List[str]] = None,
    ) -> None:
        self.name = "chunk-boundary-leak"
        self.action = action
        self._separators = (
            _DEFAULT_SEPARATORS + custom_separators
            if custom_separators
            else _DEFAULT_SEPARATORS
        )

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        found: list[str] = []

        for sep in self._separators:
            if sep.lower() in lower:
                found.append(sep)

        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="chunk-boundary-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Chunk boundary separators leaked"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"leaked_separators": found}
                if triggered
                else None
            ),
        )


def chunk_boundary_leak(
    *,
    action: str = "warn",
    custom_separators: Optional[List[str]] = None,
) -> _ChunkBoundaryLeak:
    return _ChunkBoundaryLeak(
        action=action,
        custom_separators=custom_separators,
    )
