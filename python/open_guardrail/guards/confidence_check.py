"""Detects low-confidence hedging language."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_HEDGE_PATTERNS = [
    r"\bi'm not sure\b",
    r"\bi think\b",
    r"\bmaybe\b",
    r"\bpossibly\b",
    r"\bit depends\b",
]


class _ConfidenceCheck:
    def __init__(
        self, *, action: str = "warn", max_hedge_ratio: float = 0.1,
    ) -> None:
        self.name = "confidence-check"
        self.action = action
        self.max_hedge_ratio = max_hedge_ratio

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        words = text.split()
        total_words = len(words) if words else 1
        hedge_count = sum(len(re.findall(p, lower)) for p in _HEDGE_PATTERNS)
        ratio = hedge_count / total_words
        triggered = ratio > self.max_hedge_ratio
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"High hedging ratio: {ratio:.2f} > {self.max_hedge_ratio}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"hedge_count": hedge_count, "total_words": total_words, "ratio": round(ratio, 4)} if triggered else None,
        )


def confidence_check(
    *, action: str = "warn", max_hedge_ratio: float = 0.1,
) -> _ConfidenceCheck:
    return _ConfidenceCheck(action=action, max_hedge_ratio=max_hedge_ratio)
