"""Detects time-sensitive claims in text."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_TIME_PATTERNS = [
    r"\bas of today\b",
    r"\bcurrently\b",
    r"\bright now\b",
    r"\blatest data shows\b",
    r"\bthis year\b",
]


class _TimeSensitive:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "time-sensitive"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        found: List[str] = []
        for pattern in _TIME_PATTERNS:
            matches = re.findall(pattern, lower)
            found.extend(matches)
        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Time-sensitive language detected: {', '.join(found)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matches": found} if triggered else None,
        )


def time_sensitive(*, action: str = "warn") -> _TimeSensitive:
    return _TimeSensitive(action=action)
