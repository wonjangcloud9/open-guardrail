"""Detect expired or revoked API keys."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_KEY_PATTERNS = [
    re.compile(
        r"(?:expired|revoked|invalid|old)"
        r"[\s_-]*(?:api|secret|access)[\s_-]*key",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:api|secret|access)[\s_-]*key"
        r"[\s:=]*\S+.*(?:expired|revoked|invalid)",
        re.IGNORECASE,
    ),
    re.compile(
        r"sk[-_](?:live|test)_[A-Za-z0-9]{20,}"
        r".*(?:expired|revoked|rotate)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}"
        r".*(?:expired|revoked|rotate)",
        re.IGNORECASE,
    ),
    re.compile(
        r"key[\s_-]*(?:needs?|requires?|must)"
        r"[\s_-]*rotat",
        re.IGNORECASE,
    ),
]


class _ApiKeyRotation:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "api-key-rotation"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _KEY_PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="api-key-rotation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Expired or revoked API key detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text references expired, revoked,"
                        " or rotation-needed API keys"
                    ),
                }
                if triggered
                else None
            ),
        )


def api_key_rotation(
    *, action: str = "warn"
) -> _ApiKeyRotation:
    return _ApiKeyRotation(action=action)
