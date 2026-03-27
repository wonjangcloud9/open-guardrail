"""Validates content length within bounds."""

import time
from typing import Optional

from open_guardrail.core import GuardResult


class _ContentLength:
    def __init__(
        self, *, action: str = "block", min_length: int = 0, max_length: int = 10000,
    ) -> None:
        self.name = "content-length"
        self.action = action
        self.min_length = min_length
        self.max_length = max_length

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        length = len(text)
        reason: Optional[str] = None
        if length < self.min_length:
            reason = f"Too short: {length} < {self.min_length}"
        elif length > self.max_length:
            reason = f"Too long: {length} > {self.max_length}"
        triggered = reason is not None
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="content-length",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=reason,
            latency_ms=round(elapsed, 2),
            details={"length": length, "min": self.min_length, "max": self.max_length} if triggered else None,
        )


def content_length(
    *, action: str = "block", min_length: int = 0, max_length: int = 10000,
) -> _ContentLength:
    return _ContentLength(action=action, min_length=min_length, max_length=max_length)
