"""Detect responses unsafe for caching."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PII = [
    re.compile(r"\b\d{3}[-.]?\d{2}[-.]?\d{4}\b"),
    re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+"
        r"\.[A-Z]{2,}\b",
        re.I,
    ),
]

_TIMESTAMPS = [
    re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}"),
    re.compile(r"\d{1,2}:\d{2}\s*(?:AM|PM)\b", re.I),
]

_USER_SPECIFIC = [
    re.compile(r"\byour\s+account\b", re.I),
    re.compile(r"\byour\s+order\b", re.I),
    re.compile(r"\byour\s+balance\b", re.I),
]

_SESSION = [
    re.compile(r"\bsession[_\s-]?id\b", re.I),
    re.compile(r"\blogged\s+in\s+as\b", re.I),
]


class _ResponseCachingSafe:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "response-caching-safe"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        reasons: List[str] = []
        for p in _PII:
            if p.search(text):
                reasons.append("pii")
                break
        for p in _TIMESTAMPS:
            if p.search(text):
                reasons.append("timestamp")
                break
        for p in _USER_SPECIFIC:
            if p.search(text):
                reasons.append("user-specific")
                break
        for p in _SESSION:
            if p.search(text):
                reasons.append("session-ref")
                break
        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="response-caching-safe",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Unsafe for caching: {', '.join(reasons)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"reasons": reasons} if triggered else None
            ),
        )


def response_caching_safe(
    *, action: str = "warn"
) -> _ResponseCachingSafe:
    return _ResponseCachingSafe(action=action)
