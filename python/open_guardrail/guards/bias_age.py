"""Age bias detection guard."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\btoo\s+old\s+(to|for)\b", re.I),
    re.compile(r"\btoo\s+young\s+(to|for)\b", re.I),
    re.compile(r"\bsenior\s+moment\b", re.I),
    re.compile(r"\bok\s+boomer\b", re.I),
    re.compile(r"\bdigital\s+native\b", re.I),
    re.compile(r"\bover\s+the\s+hill\b", re.I),
    re.compile(
        r"\bpast\s+(their|his|her)\s+prime\b", re.I
    ),
    re.compile(r"\bold\s+people\s+can'?t\b", re.I),
    re.compile(
        r"\bmillennials\s+are\s+(lazy|entitled)\b", re.I
    ),
    re.compile(r"\bkids\s+these\s+days\b", re.I),
    re.compile(
        r"\bgen\s+z\s+(is|are)\s+(lazy|useless)\b", re.I
    ),
    re.compile(
        r"\byoung\s+people\s+don'?t\s+understand\b",
        re.I,
    ),
    re.compile(
        r"\bage\s+\d+\s+or\s+(older|younger)"
        r"\s+need\s+not\s+apply\b",
        re.I,
    ),
    re.compile(r"\bno\s+one\s+over\s+\d+\b", re.I),
    re.compile(r"\btoo\s+old\s+to\s+learn\b", re.I),
]


class _BiasAge:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "bias-age"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="bias-age",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Age bias detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": "Age bias detected",
                }
                if triggered
                else None
            ),
        )


def bias_age(*, action: str = "warn") -> _BiasAge:
    return _BiasAge(action=action)
