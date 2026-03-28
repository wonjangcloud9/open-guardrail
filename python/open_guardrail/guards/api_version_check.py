"""Validate API version references and detect deprecated versions."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"api[\/\-_]?v[0-1](?:\b|\/)", re.IGNORECASE
    ),
    re.compile(
        r"version\s*[:=]\s*['\"]?[0-1]\b", re.IGNORECASE
    ),
    re.compile(r"sdk[\/\-_]?v?[0-2]\.\d+", re.IGNORECASE),
    re.compile(
        r"api-version\s*=\s*20(?:1[0-9]|20|21)",
        re.IGNORECASE,
    ),
    re.compile(
        r"deprecated.*(?:api|endpoint|version)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:api|endpoint|version).*deprecated",
        re.IGNORECASE,
    ),
    re.compile(
        r"v1\s*(?:is|was|has been)"
        r"\s*(?:removed|sunset|eol)",
        re.IGNORECASE,
    ),
    re.compile(
        r"end[- ]?of[- ]?life\s+(?:api|version)",
        re.IGNORECASE,
    ),
]


class _ApiVersionCheck:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "api-version-check"
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
            guard_name="api-version-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Deprecated API version detected"
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


def api_version_check(
    *, action: str = "warn"
) -> _ApiVersionCheck:
    return _ApiVersionCheck(action=action)
