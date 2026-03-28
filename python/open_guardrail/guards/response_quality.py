"""Checks response quality heuristics."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _ResponseQuality:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "response-quality"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []
        if len(text.strip()) < 10:
            issues.append("Response too short (< 10 chars)")
        if text == text.upper() and len(text.strip()) > 0 and any(c.isalpha() for c in text):
            issues.append("Response is all caps")
        if re.search(r'[!?.]{11,}', text):
            issues.append("Excessive consecutive punctuation (> 10)")
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def response_quality(*, action: str = "warn") -> _ResponseQuality:
    return _ResponseQuality(action=action)
