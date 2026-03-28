"""Detects common misinformation patterns in text."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"scientifically\s+proven\s+that", re.IGNORECASE),
    re.compile(r"100%\s+guaranteed", re.IGNORECASE),
    re.compile(r"doctors?\s+don'?t\s+want\s+you\s+to\s+know", re.IGNORECASE),
    re.compile(r"government\s+hiding", re.IGNORECASE),
]


class _Misinformation:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "misinformation"
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
            guard_name="misinformation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Misinformation pattern detected: {len(matched)} match(es)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def misinformation(*, action: str = "warn") -> _Misinformation:
    return _Misinformation(action=action)
