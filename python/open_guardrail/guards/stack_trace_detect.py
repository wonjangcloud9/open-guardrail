"""Detect stack traces in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"at\s+\w+\s+\([^)]+:\d+:\d+\)"
    ),
    re.compile(r"at\s+[^(]+\([^)]+\)"),
    re.compile(
        r'File\s+"[^"]+",\s+line\s+\d+'
    ),
    re.compile(
        r"Traceback\s+\(most\s+recent\s+"
        r"call\s+last\)",
        re.IGNORECASE,
    ),
    re.compile(
        r'Exception\s+in\s+thread\s+"'
    ),
    re.compile(
        r"\w+Error:\s+.+\n\s+at\s+",
        re.MULTILINE,
    ),
    re.compile(r"\.java:\d+\)"),
    re.compile(r'\.py",\s+line\s+\d+'),
    re.compile(r"\.go:\d+\s"),
    re.compile(r"panic:\s+runtime\s+error"),
]


class _StackTraceDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "stack-trace-detect"
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
            guard_name="stack-trace-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Stack trace detected in output"
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


def stack_trace_detect(
    *, action: str = "block"
) -> _StackTraceDetect:
    return _StackTraceDetect(action=action)
