"""Detect international passport numbers."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PASSPORT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b[A-Z]\d{8}\b"),
    re.compile(r"\b[A-Z]{2}\d{7}\b"),
    re.compile(r"\b[A-Z]{1}\d{7}[A-Z]{1}\b"),
    re.compile(r"\b[MG]\d{8}\b"),
    re.compile(r"\b[EG]\d{8}\b"),
    re.compile(r"\b\d{9}[A-Z]{2}\b"),
]


class _PassportDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "passport-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PASSPORT_PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 2, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="passport-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Passport number detected"
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


def passport_detect(
    *, action: str = "block"
) -> _PassportDetect:
    return _PassportDetect(action=action)
