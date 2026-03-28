"""Classify data sensitivity level."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_LEVELS = ["public", "internal", "confidential", "restricted"]

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\btop\s+secret\b", re.IGNORECASE), "restricted"),
    (re.compile(r"\beyes\s+only\b", re.IGNORECASE), "restricted"),
    (re.compile(r"\bclassified\b", re.IGNORECASE), "restricted"),
    (re.compile(r"\brestricted\b", re.IGNORECASE), "restricted"),
    (re.compile(r"\bconfidential\b", re.IGNORECASE), "confidential"),
    (re.compile(r"\bproprietary\b", re.IGNORECASE), "confidential"),
    (re.compile(r"\btrade\s+secret\b", re.IGNORECASE), "confidential"),
    (re.compile(r"\bembargo(ed)?\b", re.IGNORECASE), "confidential"),
    (re.compile(r"\binternal\s+only\b", re.IGNORECASE), "internal"),
]


class _DataClassification:
    def __init__(
        self,
        *,
        action: str = "block",
        min_level: str = "confidential",
    ) -> None:
        self.name = "data-classification"
        self.action = action
        self._min_idx = _LEVELS.index(min_level)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        highest = "public"
        matched: list[str] = []

        for pat, level in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)
                idx = _LEVELS.index(level)
                if idx > _LEVELS.index(highest):
                    highest = level

        h_idx = _LEVELS.index(highest)
        triggered = h_idx >= self._min_idx
        score = h_idx / (len(_LEVELS) - 1)
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="data-classification",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                f"Sensitive data ({highest})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "classification_level": highest,
                "matched_patterns": len(matched),
            },
        )


def data_classification(
    *,
    action: str = "block",
    min_level: str = "confidential",
) -> _DataClassification:
    return _DataClassification(
        action=action, min_level=min_level
    )
