"""Detect timezone-related issues in text."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
        r"(?:\.\d+)?(?!Z|[+-]\d{2}:?\d{2})\b"
    ),
    re.compile(
        r"\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}"
        r"(?:\.\d+)?"
        r"(?!\s*(?:UTC|GMT|Z|[+-]\d{2}|[A-Z]{2,5}))\s"
    ),
    re.compile(
        r"(?:UTC|GMT)\s.*(?:EST|PST|CST|MST|CET|IST|JST|KST)"
    ),
    re.compile(r"(?:EST|PST|CST|MST)\s.*(?:UTC|GMT)"),
    re.compile(
        r"new\s+Date\(\s*['\"]?\d{4}-\d{2}-\d{2}"
        r"['\"]?\s*\)"
    ),
]


class _TimeZoneSafety:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "time-zone-safety"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="time-zone-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Timezone issues detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def time_zone_safety(
    *, action: str = "warn"
) -> _TimeZoneSafety:
    return _TimeZoneSafety(action=action)
