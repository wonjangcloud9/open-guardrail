"""Duplicate content detection guard."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult


class _DuplicateDetect:
    def __init__(self, *, action: str = "warn", threshold: float = 0.3) -> None:
        self.name = "duplicate-detect"
        self.action = action
        self.threshold = threshold

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        sentences = [s.strip().lower() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 10]
        counts: dict[str, int] = {}
        for s in sentences:
            counts[s] = counts.get(s, 0) + 1
        duplicates = [s for s, c in counts.items() if c >= 2]
        ratio = len(duplicates) / max(len(sentences), 1)
        triggered = ratio >= self.threshold and len(duplicates) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="duplicate-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Duplicate content: {ratio:.0%}" if triggered else None,
            score=round(ratio, 2),
            latency_ms=round(elapsed, 2),
            details={"duplicates": duplicates[:5], "ratio": round(ratio, 2)} if triggered else None,
        )


def duplicate_detect(*, action: str = "warn", threshold: float = 0.3) -> _DuplicateDetect:
    return _DuplicateDetect(action=action, threshold=threshold)
