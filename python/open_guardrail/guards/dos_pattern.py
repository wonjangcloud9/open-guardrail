"""Detect denial-of-service patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"zip\s*bomb", re.IGNORECASE),
    re.compile(r"billion\s*laughs", re.IGNORECASE),
    re.compile(r"fork\s*bomb", re.IGNORECASE),
    re.compile(r":\(\)\s*\{\s*:\|:\s*&\s*\}\s*;?\s*:"),
    re.compile(r"resource\s+exhaustion", re.IGNORECASE),
    re.compile(
        r"infinite\s+(recursion|loop|request)",
        re.IGNORECASE,
    ),
    re.compile(r"while\s*\(\s*true\s*\)", re.IGNORECASE),
    re.compile(r"memory\s+exhaustion", re.IGNORECASE),
    re.compile(r"stack\s+overflow\s+attack", re.IGNORECASE),
    re.compile(
        r"xml\s+entity\s+expansion", re.IGNORECASE
    ),
    re.compile(r"decompression\s+bomb", re.IGNORECASE),
    re.compile(r"denial.of.service", re.IGNORECASE),
    re.compile(
        r"(?:repeat|generate|create)\s+"
        r"(?:\d{6,}|infinite|unlimited)\s",
        re.IGNORECASE,
    ),
]


class _DosPattern:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "dos-pattern"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="dos-pattern",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "DoS pattern detected" if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def dos_pattern(*, action: str = "block") -> _DosPattern:
    return _DosPattern(action=action)
