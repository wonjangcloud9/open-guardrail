"""Detects duplicate content blocks in responses."""

import re
import time

from open_guardrail.core import GuardResult


def _simple_hash(s: str) -> int:
    h = 0
    for ch in s:
        h = ((h << 5) - h + ord(ch)) & 0xFFFFFFFF
    return h


class _ContentDedup:
    def __init__(
        self, *, action: str = "warn", block_size: int = 100
    ) -> None:
        self.name = "content-dedup"
        self.action = action
        self._block_size = block_size

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        normalized = re.sub(r"\s+", " ", text).strip()
        bs = self._block_size

        if len(normalized) < bs:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="content-dedup",
                passed=True,
                action="allow",
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        seen: dict[int, int] = {}
        duplicates = 0
        total_blocks = len(normalized) // bs

        for i in range(0, len(normalized) - bs + 1, bs):
            block = normalized[i : i + bs]
            h = _simple_hash(block)
            prev = seen.get(h)
            if prev is not None and normalized[prev : prev + bs] == block:
                duplicates += 1
            else:
                seen[h] = i

        triggered = duplicates > 0
        score = (
            min(duplicates / max(total_blocks, 1), 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="content-dedup",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Duplicate content detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "duplicate_blocks": duplicates,
                    "total_blocks": total_blocks,
                }
                if triggered
                else None
            ),
        )


def content_dedup(
    *, action: str = "warn", block_size: int = 100
) -> _ContentDedup:
    return _ContentDedup(action=action, block_size=block_size)
