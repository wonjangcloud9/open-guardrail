"""Detect internal system references in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b[A-Z]{2,10}-\d{1,6}\b"),
    re.compile(
        r"https?://[a-zA-Z0-9-]+"
        r"\.atlassian\.net"
    ),
    re.compile(
        r"https?://confluence\.[a-zA-Z0-9.-]+",
        re.IGNORECASE,
    ),
    re.compile(
        r"https?://jira\.[a-zA-Z0-9.-]+",
        re.IGNORECASE,
    ),
    re.compile(
        r"https?://wiki\.[a-zA-Z0-9.-]+"
        r"/internal",
        re.IGNORECASE,
    ),
    re.compile(r"#[a-z][a-z0-9-]*-internal\b"),
    re.compile(r"\bEMP-?\d{4,8}\b"),
    re.compile(
        r"\bslack\.com/archives/C[A-Z0-9]+"
    ),
    re.compile(
        r"https?://[a-zA-Z0-9-]+"
        r"\.sharepoint\.com"
    ),
    re.compile(r"\binternal[_-]doc[_-]\d+\b", re.IGNORECASE),
]


class _InternalReferenceDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "internal-reference-detect"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="internal-reference-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Internal reference detected"
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


def internal_reference_detect(
    *, action: str = "block"
) -> _InternalReferenceDetect:
    return _InternalReferenceDetect(action=action)
