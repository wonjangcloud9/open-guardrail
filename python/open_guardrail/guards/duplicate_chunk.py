"""Detect duplicate or near-duplicate chunks in RAG-retrieved text."""
from __future__ import annotations

import re
import time
from typing import List, Optional, Tuple

from open_guardrail.core import GuardResult


def _trigram_similarity(a: str, b: str) -> float:
    if a == b:
        return 1.0
    if len(a) < 3 or len(b) < 3:
        return 1.0 if a == b else 0.0
    tri_a = {a[i : i + 3] for i in range(len(a) - 2)}
    tri_b = {b[i : i + 3] for i in range(len(b) - 2)}
    intersection = len(tri_a & tri_b)
    return (2 * intersection) / (len(tri_a) + len(tri_b))


class _DuplicateChunk:
    def __init__(
        self,
        *,
        action: str = "warn",
        similarity_threshold: float = 0.8,
        min_chunk_length: int = 50,
    ) -> None:
        self.name = "duplicate-chunk"
        self.action = action
        self.similarity_threshold = similarity_threshold
        self.min_chunk_length = min_chunk_length

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        chunks = [
            c.strip()
            for c in re.split(r"\n---\n|\n\n|---", text)
            if len(c.strip()) >= self.min_chunk_length
        ]

        max_sim = 0.0
        dup_pair: Optional[Tuple[int, int]] = None

        for i in range(len(chunks)):
            for j in range(i + 1, len(chunks)):
                sim = _trigram_similarity(
                    chunks[i].lower(), chunks[j].lower()
                )
                if sim > max_sim:
                    max_sim = sim
                    dup_pair = (i, j)

        triggered = max_sim >= self.similarity_threshold
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Duplicate chunks (similarity {max_sim:.2f})" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"similarity": max_sim, "chunk_indices": list(dup_pair)} if triggered and dup_pair else None,
        )


def duplicate_chunk(
    *,
    action: str = "warn",
    similarity_threshold: float = 0.8,
    min_chunk_length: int = 50,
) -> _DuplicateChunk:
    return _DuplicateChunk(
        action=action,
        similarity_threshold=similarity_threshold,
        min_chunk_length=min_chunk_length,
    )
