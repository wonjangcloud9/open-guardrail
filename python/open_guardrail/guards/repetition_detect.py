"""Detects repetitive text patterns."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult


class _RepetitionDetect:
    def __init__(self, *, action: str = "warn", max_ratio: float = 0.3, min_repeat_length: int = 3) -> None:
        self.name = "repetition-detect"
        self.action = action
        self.max_ratio = max_ratio
        self.min_len = min_repeat_length

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        words = text.lower().split()
        total = len(words)
        if total < 4:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(guard_name="repetition-detect", passed=True, action="allow", latency_ms=round(elapsed, 2))
        repeated = 0
        seen: dict[str, int] = {}
        for w in words:
            if len(w) >= self.min_len:
                seen[w] = seen.get(w, 0) + 1
                if seen[w] > 2:
                    repeated += 1
        ratio = repeated / total
        triggered = ratio > self.max_ratio
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="repetition-detect", passed=not triggered, action=self.action if triggered else "allow", message=f"Repetition ratio: {ratio:.0%}" if triggered else None, score=round(ratio, 2), latency_ms=round(elapsed, 2), details={"ratio": round(ratio, 2), "repeated_words": repeated} if triggered else None)


def repetition_detect(*, action: str = "warn", max_ratio: float = 0.3, min_repeat_length: int = 3) -> _RepetitionDetect:
    return _RepetitionDetect(action=action, max_ratio=max_ratio, min_repeat_length=min_repeat_length)
