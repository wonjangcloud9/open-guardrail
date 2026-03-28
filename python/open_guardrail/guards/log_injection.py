"""Detect log injection and forging attempts."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\n\s*\[(?:INFO|WARN|ERROR|DEBUG|FATAL|TRACE)\]"
    ),
    re.compile(
        r"\n\s*(?:INFO|WARN|ERROR|DEBUG|FATAL)\s*[-:]"
    ),
    re.compile(r"\x1b\["),
    re.compile(r"\\x1[bB]\["),
    re.compile(r"\\u001[bB]\["),
    re.compile(
        r"\n.*\d{4}[-/]\d{2}[-/]\d{2}"
        r"\s+\d{2}:\d{2}:\d{2}"
    ),
    re.compile(r"%0[aAdD]"),
    re.compile(
        r"\\n\s*\[(?:INFO|WARN|ERROR|DEBUG|FATAL)\]"
    ),
]


class _LogInjection:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "log-injection"
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
            guard_name="log-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Log injection detected"
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


def log_injection(
    *, action: str = "block"
) -> _LogInjection:
    return _LogInjection(action=action)
