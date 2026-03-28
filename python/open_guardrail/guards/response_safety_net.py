"""Catch-all safety net combining quick response checks."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CONTROL_CHAR_RE = re.compile(
    r"[\x00-\x08\x0b\x0c\x0e-\x1f]"
)
_RAW_HTML_RE = re.compile(
    r"<\s*(script|iframe|object|embed"
    r"|form|style)\b",
    re.IGNORECASE,
)
_BINARY_RE = re.compile(
    r"[\x00-\x08\x0e-\x1f]{3,}"
)


class _ResponseSafetyNet:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "response-safety-net"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if not text.strip():
            issues.append("empty-response")
        if len(text) > 100_000:
            issues.append("excessive-length")
        if _RAW_HTML_RE.search(text):
            issues.append("raw-html")
        if _BINARY_RE.search(text):
            issues.append("binary-data")
        if _CONTROL_CHAR_RE.search(text):
            issues.append("control-chars")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="response-safety-net",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Response safety net triggered"
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


def response_safety_net(
    *, action: str = "block"
) -> _ResponseSafetyNet:
    return _ResponseSafetyNet(action=action)
