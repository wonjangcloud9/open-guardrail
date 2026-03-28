"""Detect international phone number formats."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PHONE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\+\d{1,3}\d{6,14}"),
    re.compile(
        r"\+\d{1,3}[\s.-]\d{1,4}[\s.-]"
        r"\d{3,4}[\s.-]\d{3,4}"
    ),
    re.compile(r"\(\d{2,4}\)\s?\d{3,4}[\s.-]?\d{3,4}"),
    re.compile(r"\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b"),
    re.compile(r"\b0\d{2,4}[\s.-]\d{6,8}\b"),
    re.compile(r"\b0\d{1,2}-\d{3,4}-\d{4}\b"),
]


class _PhoneFormatIntl:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "phone-format-intl"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PHONE_PATTERNS:
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
            guard_name="phone-format-intl",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "International phone number detected"
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


def phone_format_intl(
    *, action: str = "block"
) -> _PhoneFormatIntl:
    return _PhoneFormatIntl(action=action)
