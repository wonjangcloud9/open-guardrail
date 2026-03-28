"""Validate API key format and detect fake keys."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_FAKE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^0{16,}$"),
    re.compile(r"^1{16,}$"),
    re.compile(
        r"^(test|demo|fake|example|placeholder)",
        re.IGNORECASE,
    ),
    re.compile(r"^sk-0{20,}"),
    re.compile(r"^AKIA0{12,}"),
]


class _ApiKeyFormat:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "api-key-format"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        trimmed = text.strip()

        for pat in _FAKE_PATTERNS:
            if pat.search(trimmed):
                issues.append("fake-key")
                break

        if len(trimmed) < 8:
            issues.append("too-short")

        if not re.match(
            r"^[a-zA-Z0-9_\-.:]+$", trimmed
        ):
            issues.append("invalid-chars")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 2, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="api-key-format",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "API key format invalid"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues}
                if triggered
                else None
            ),
        )


def api_key_format(
    *, action: str = "block"
) -> _ApiKeyFormat:
    return _ApiKeyFormat(action=action)
