"""Detect age-restricted content markers."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_AGE_PATTERNS = [
    re.compile(r"18\s*\+"),
    re.compile(r"21\s*\+"),
    re.compile(
        r"adults?\s+only", re.IGNORECASE
    ),
    re.compile(
        r"age\s+restricted", re.IGNORECASE
    ),
    re.compile(
        r"mature\s+content", re.IGNORECASE
    ),
    re.compile(
        r"parental\s+advisory", re.IGNORECASE
    ),
    re.compile(
        r"not\s+(?:suitable|appropriate)\s+"
        r"for\s+(?:children|minors)",
        re.IGNORECASE,
    ),
    re.compile(r"nsfw", re.IGNORECASE),
    re.compile(
        r"explicit\s+content", re.IGNORECASE
    ),
]


class _AgeGate:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "age-gate"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _AGE_PATTERNS:
            match = pat.search(text)
            if match:
                found.append(match.group())

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not found:
            return GuardResult(
                guard_name="age-gate",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="age-gate",
            passed=False,
            action=self.action,
            message=(
                "Age-restricted content detected"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": found,
                "reason": (
                    "Text contains age-restricted"
                    " content markers"
                ),
            },
        )


def age_gate(
    *, action: str = "block"
) -> _AgeGate:
    return _AgeGate(action=action)
