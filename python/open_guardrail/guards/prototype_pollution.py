"""Detect prototype pollution attempts."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"__proto__"),
    re.compile(r"constructor\s*\.\s*prototype"),
    re.compile(r"constructor\s*\["),
    re.compile(r"Object\s*\.\s*assign\s*\("),
    re.compile(r"Object\s*\.\s*defineProperty\s*\("),
    re.compile(r'\["__proto__"\]'),
    re.compile(r"\['__proto__'\]"),
    re.compile(r"JSON\s*\.\s*parse\s*\(.*__proto__"),
    re.compile(
        r"prototype\s*\.\s*"
        r"(?:toString|valueOf|hasOwnProperty)\s*="
    ),
    re.compile(r'\{\s*"__proto__"\s*:'),
]


class _PrototypePollution:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "prototype-pollution"
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
            guard_name="prototype-pollution",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Prototype pollution attempt detected"
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


def prototype_pollution(
    *, action: str = "block"
) -> _PrototypePollution:
    return _PrototypePollution(action=action)
