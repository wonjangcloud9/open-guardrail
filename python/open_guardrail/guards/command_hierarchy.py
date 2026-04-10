"""Prevents lower-priority instructions from overriding higher ones."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_OVERRIDE_PATTERNS = [
    "ignore previous",
    "disregard above",
    "override instructions",
    "new instructions:",
    "forget everything",
    "ignore all prior",
    "skip the rules",
    "bypass restrictions",
    "you are now",
    "act as if",
    "pretend that",
    "your new role",
]


class _CommandHierarchy:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "command-hierarchy"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched = [p for p in _OVERRIDE_PATTERNS if p in lower]
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="command-hierarchy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Command hierarchy override attempt detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_patterns": matched} if triggered else None,
        )


def command_hierarchy(*, action: str = "block") -> _CommandHierarchy:
    return _CommandHierarchy(action=action)
