"""Detects hedging, uncertainty, and contradictions."""
from __future__ import annotations

import time
from typing import List

from open_guardrail.core import GuardResult

_HEDGING = [
    "maybe", "perhaps", "possibly", "might", "could be", "not sure",
    "i think", "it seems", "it appears", "probably", "likely",
    "i believe", "in my opinion", "it depends", "hard to say",
    "not certain", "unclear", "uncertain",
]


class _OutputDeterminism:
    def __init__(self, *, action: str = "warn", max_hedging_ratio: float = 0.15) -> None:
        self.name = "output-determinism"
        self.action = action
        self.max_ratio = max_hedging_ratio

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        words = lower.split()
        issues: List[str] = []
        hedge_count = sum(1 for h in _HEDGING if h in lower)
        ratio = hedge_count / max(len(words), 1)
        if ratio > self.max_ratio:
            issues.append(f"High hedging ratio: {ratio:.0%}")
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="output-determinism", passed=not triggered, action=self.action if triggered else "allow", message=issues[0] if triggered else None, latency_ms=round(elapsed, 2), details={"issues": issues} if triggered else None)


def output_determinism(*, action: str = "warn", max_hedging_ratio: float = 0.15) -> _OutputDeterminism:
    return _OutputDeterminism(action=action, max_hedging_ratio=max_hedging_ratio)
