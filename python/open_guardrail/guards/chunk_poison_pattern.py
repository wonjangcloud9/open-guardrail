"""Detect injected instructions hidden inside retrieved chunks."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_POISON_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bignore\s+above\b", re.IGNORECASE),
    re.compile(r"\bnew\s+instructions:", re.IGNORECASE),
    re.compile(r"\bsystem\s+override\b", re.IGNORECASE),
    re.compile(r"\bIMPORTANT:"),
    re.compile(r"\bADMIN:"),
    re.compile(r"\byou\s+must\s+now\b", re.IGNORECASE),
    re.compile(r"\bdisregard\s+context\b", re.IGNORECASE),
    re.compile(r"\bforget\s+the\s+above\b", re.IGNORECASE),
    re.compile(r"\binstead\s+do\b", re.IGNORECASE),
    re.compile(r"\bactually,\s", re.IGNORECASE),
    re.compile(r"\bcorrection:", re.IGNORECASE),
    re.compile(r"\boverride:", re.IGNORECASE),
    re.compile(r"\breal\s+instructions:", re.IGNORECASE),
    re.compile(r"\bhidden\s+instruction\b", re.IGNORECASE),
]


class _ChunkPoisonPattern:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "chunk-poison-pattern"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pattern in _POISON_PATTERNS:
            m = pattern.search(text)
            if m:
                matched.append(m.group())

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="chunk-poison-pattern",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Poison patterns detected in chunk"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": matched}
                if triggered
                else None
            ),
        )


def chunk_poison_pattern(
    *, action: str = "block"
) -> _ChunkPoisonPattern:
    return _ChunkPoisonPattern(action=action)
