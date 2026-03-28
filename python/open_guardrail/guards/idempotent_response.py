"""Detect potentially non-idempotent responses."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_TIMESTAMP: list[re.Pattern[str]] = [
    re.compile(
        r"\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
    ),
    re.compile(
        r"\b\d{1,2}:\d{2}(?::\d{2})?"
        r"\s*(?:AM|PM)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:today|now)\s+(?:is|at)\s+",
        re.IGNORECASE,
    ),
]

_TEMPORAL: list[re.Pattern[str]] = [
    re.compile(r"\bjust\s+now\b", re.IGNORECASE),
    re.compile(r"\bright\s+now\b", re.IGNORECASE),
    re.compile(
        r"\bat\s+this\s+(?:very\s+)?moment\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bcurrently\s+(?:it\s+is|the\s+time)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bas\s+of\s+(?:right\s+)?now\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bat\s+the\s+time\s+of"
        r"\s+(?:writing|this\s+response)\b",
        re.IGNORECASE,
    ),
]

_UUID = re.compile(
    r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}"
    r"-[0-9a-f]{4}-[0-9a-f]{12}\b",
    re.IGNORECASE,
)

_RANDOM_NUM = re.compile(
    r"\b(?:random|generated)\s*(?::?\s*)\d+\b",
    re.IGNORECASE,
)


class _IdempotentResponse:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "idempotent-response"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if any(p.search(text) for p in _TIMESTAMP):
            issues.append("timestamp_present")
        if any(p.search(text) for p in _TEMPORAL):
            issues.append("temporal_reference")
        if _UUID.search(text):
            issues.append("uuid_present")
        if _RANDOM_NUM.search(text):
            issues.append("random_number")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="idempotent-response",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Non-idempotent response detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def idempotent_response(
    *, action: str = "warn"
) -> _IdempotentResponse:
    return _IdempotentResponse(action=action)
