"""Detect NoSQL injection attempts."""

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\$gt\b"),
    re.compile(r"\$ne\b"),
    re.compile(r"\$regex\b"),
    re.compile(r"\$where\b"),
    re.compile(r"\$or\b"),
    re.compile(r"\$and\b"),
    re.compile(r"\$nin\b"),
    re.compile(r"db\.\w+\.find\s*\("),
    re.compile(r"mapReduce\s*\(", re.IGNORECASE),
    re.compile(r'\{\s*"\$\w+"\s*:'),
]


class _NosqlInjection:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "nosql-injection"
        self.action = action
        self._patterns = list(_PATTERNS)

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="nosql-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="NoSQL injection detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def nosql_injection(*, action: str = "block") -> _NosqlInjection:
    return _NosqlInjection(action=action)
