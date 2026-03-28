"""Detect GPS coordinates."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_COORD_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"[-+]?\d{1,2}\.\d{4,}"
        r",\s*[-+]?\d{1,3}\.\d{4,}"
    ),
    re.compile(
        r"\d{1,3}\xb0\s*\d{1,2}['\u2032]\s*"
        r"\d{1,2}(?:\.\d+)?[\"\u2033]?\s*[NSEW]"
    ),
    re.compile(
        r"(?:lat|latitude)\s*[:=]?\s*"
        r"[-+]?\d{1,2}\.\d+",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:lng|lon|longitude)\s*[:=]?\s*"
        r"[-+]?\d{1,3}\.\d+",
        re.IGNORECASE,
    ),
]


class _CoordinateDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "coordinate-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _COORD_PATTERNS:
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
            guard_name="coordinate-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "GPS coordinates detected"
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


def coordinate_detect(
    *, action: str = "block"
) -> _CoordinateDetect:
    return _CoordinateDetect(action=action)
