"""Detects boundary-testing attacks."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
_REPEATED_CHAR_RE = re.compile(r"(.)\1{99,}")


class _BoundaryTest:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "boundary-test"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        if _CONTROL_CHAR_RE.search(text):
            issues.append("control_chars")

        if _REPEATED_CHAR_RE.search(text):
            issues.append("repeated_char_attack")

        if len(text) > 100000:
            issues.append("excessive_length")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Boundary test attack detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def boundary_test(*, action: str = "block") -> _BoundaryTest:
    return _BoundaryTest(action=action)
