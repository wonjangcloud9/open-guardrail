"""Detects financial advice patterns in text."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"invest\s+in\b", re.IGNORECASE),
    re.compile(r"(?:buy|sell)\s+stock", re.IGNORECASE),
    re.compile(r"financial\s+portfolio", re.IGNORECASE),
    re.compile(r"guaranteed\s+returns", re.IGNORECASE),
    re.compile(r"high\s+yield", re.IGNORECASE),
]


class _FinancialAdvice:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "financial-advice"
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
            guard_name="financial-advice",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Financial advice detected: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def financial_advice(*, action: str = "warn") -> _FinancialAdvice:
    return _FinancialAdvice(action=action)
