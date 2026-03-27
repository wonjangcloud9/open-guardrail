"""Ensures response is a single line."""

import time

from open_guardrail.core import GuardResult


class _SingleLine:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "single-line"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lines = text.strip().split("\n")
        triggered = len(lines) > 1
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(guard_name="single-line", passed=not triggered, action=self.action if triggered else "allow", message=f"Expected single line, got {len(lines)}" if triggered else None, latency_ms=round(elapsed, 2), details={"line_count": len(lines)} if triggered else None)


def single_line(*, action: str = "block") -> _SingleLine:
    return _SingleLine(action=action)
