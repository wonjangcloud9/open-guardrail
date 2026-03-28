"""Detect software version information leaks."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"Apache/\d+\.\d+"),
    re.compile(r"nginx/\d+\.\d+"),
    re.compile(r"PHP/\d+\.\d+"),
    re.compile(r"Node\.js/v?\d+\.\d+"),
    re.compile(r"Python/\d+\.\d+"),
    re.compile(
        r"Server:\s*\w+/\d+\.\d+", re.IGNORECASE
    ),
    re.compile(
        r"X-Powered-By:\s*\w+", re.IGNORECASE
    ),
    re.compile(r"Microsoft-IIS/\d+\.\d+"),
    re.compile(r"OpenSSL/\d+\.\d+"),
    re.compile(r"Express/\d+\.\d+"),
    re.compile(r"Django/\d+\.\d+"),
    re.compile(r"Rails/\d+\.\d+"),
]


class _VersionInfoDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "version-info-detect"
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
            guard_name="version-info-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Software version info detected"
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


def version_info_detect(
    *, action: str = "block"
) -> _VersionInfoDetect:
    return _VersionInfoDetect(action=action)
