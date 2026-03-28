"""Detects chain-of-thought reasoning leaks in output."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"<thinking>", re.IGNORECASE),
    re.compile(r"\[SCRATCHPAD\]", re.IGNORECASE),
    re.compile(r"let\s+me\s+think\s+step\s+by\s+step", re.IGNORECASE),
    re.compile(r"my\s+internal\s+reasoning", re.IGNORECASE),
    re.compile(r"Step\s+1\s*:", re.IGNORECASE),
    re.compile(r"<internal>", re.IGNORECASE),
]


class _ChainOfThoughtLeak:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "chain-of-thought-leak"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group())
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="chain-of-thought-leak",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"CoT leak detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def chain_of_thought_leak(*, action: str = "block") -> _ChainOfThoughtLeak:
    return _ChainOfThoughtLeak(action=action)
