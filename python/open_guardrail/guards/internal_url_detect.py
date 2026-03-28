"""Detect internal/private URLs in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"https?://localhost(:\d+)?", re.IGNORECASE
    ),
    re.compile(
        r"https?://127\.0\.0\.1(:\d+)?",
        re.IGNORECASE,
    ),
    re.compile(
        r"https?://0\.0\.0\.0(:\d+)?", re.IGNORECASE
    ),
    re.compile(
        r"https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    ),
    re.compile(
        r"https?://172\.(1[6-9]|2\d|3[01])"
        r"\.\d{1,3}\.\d{1,3}"
    ),
    re.compile(
        r"https?://192\.168\.\d{1,3}\.\d{1,3}"
    ),
    re.compile(
        r"https?://[a-zA-Z0-9-]+\.local\b"
    ),
    re.compile(
        r"https?://[a-zA-Z0-9-]+\.internal\b"
    ),
    re.compile(
        r"https?://[a-zA-Z0-9-]+\.corp\b"
    ),
    re.compile(r"https?://\[::1\]"),
]


class _InternalUrlDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "internal-url-detect"
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
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="internal-url-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Internal URL detected"
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


def internal_url_detect(
    *, action: str = "block"
) -> _InternalUrlDetect:
    return _InternalUrlDetect(action=action)
