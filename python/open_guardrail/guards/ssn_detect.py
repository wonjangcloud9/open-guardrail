"""Detect US Social Security Numbers."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_SSN_PATTERN = re.compile(
    r"\b(?!000|666|9\d{2})\d{3}"
    r"-(?!00)\d{2}-(?!0000)\d{4}\b"
)


class _SsnDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "ssn-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _SSN_PATTERN.findall(text)
        triggered = len(matches) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="ssn-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=1.0 if triggered else 0.0,
            message=(
                "SSN detected" if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"ssn_count": len(matches)}
                if triggered
                else None
            ),
        )


def ssn_detect(
    *, action: str = "block"
) -> _SsnDetect:
    return _SsnDetect(action=action)
