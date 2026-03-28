"""Detect HTTP header injection attempts."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\r\n"),
    re.compile(r"%0[dD]%0[aA]"),
    re.compile(r"\\r\\n"),
    re.compile(r"Host:\s*[^\s]+", re.IGNORECASE),
    re.compile(
        r"X-Forwarded-For:\s*\d{1,3}\.\d{1,3}"
        r"\.\d{1,3}\.\d{1,3}",
        re.IGNORECASE,
    ),
    re.compile(r"X-Forwarded-Host:", re.IGNORECASE),
    re.compile(r"Set-Cookie:\s*[^\s]*=", re.IGNORECASE),
    re.compile(r"Cookie:\s*[^\s]*=[^\s]*", re.IGNORECASE),
    re.compile(
        r"Transfer-Encoding:\s*chunked", re.IGNORECASE
    ),
]


class _HeaderInjection:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "header-injection"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "input"
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
            guard_name="header-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "HTTP header injection detected"
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


def header_injection(
    *, action: str = "block"
) -> _HeaderInjection:
    return _HeaderInjection(action=action)
