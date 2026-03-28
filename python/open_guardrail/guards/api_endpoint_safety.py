"""Validate API endpoint references for safety."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"/(admin|debug|internal|_debug|_admin"
        r"|_internal)/",
        re.IGNORECASE,
    ),
    re.compile(
        r"/(api/v0|api/beta|api/test|api/dev)\b",
        re.IGNORECASE,
    ),
    re.compile(r"localhost:\d+/api", re.IGNORECASE),
    re.compile(r"127\.0\.0\.1:\d+/api", re.IGNORECASE),
    re.compile(
        r"/(swagger|graphql-playground"
        r"|phpmyadmin|actuator)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"/(health|metrics|status|info|env)"
        r"(?:/|\s|$)",
        re.IGNORECASE,
    ),
    re.compile(r"/(\.env|\.git|\.config|wp-admin)"),
    re.compile(r"/api/deprecated/", re.IGNORECASE),
]


class _ApiEndpointSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "api-endpoint-safety"
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
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="api-endpoint-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Unsafe API endpoint detected"
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


def api_endpoint_safety(
    *, action: str = "block"
) -> _ApiEndpointSafety:
    return _ApiEndpointSafety(action=action)
