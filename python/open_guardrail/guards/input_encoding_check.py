"""Validate input encoding for security issues."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_BOM_PATTERNS = [
    re.compile(r"^\uFEFF"),
    re.compile(r"^\uFFFE"),
]

_NULL_RE = re.compile(r"\x00")

_OVERLONG = [
    re.compile(r"\\xc0\\x80"),
    re.compile(r"\\xe0\\x80\\x80"),
    re.compile(r"%c0%80", re.I),
]

_MIXED_RE = re.compile(
    r"(?:[\xc0-\xdf][\x80-\xbf].*[\x80-\xbf]{3})"
    r"|(?:\\u[0-9a-f]{4}.*\\x[0-9a-f]{2})",
    re.I,
)


class _InputEncodingCheck:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "input-encoding-check"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for p in _BOM_PATTERNS:
            if p.search(text):
                issues.append("bom_marker")

        if _NULL_RE.search(text):
            issues.append("null_byte")

        for p in _OVERLONG:
            if p.search(text):
                issues.append("overlong_encoding")

        if _MIXED_RE.search(text):
            issues.append("mixed_encoding")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="input-encoding-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Encoding issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def input_encoding_check(
    *, action: str = "block"
) -> _InputEncodingCheck:
    return _InputEncodingCheck(action=action)
