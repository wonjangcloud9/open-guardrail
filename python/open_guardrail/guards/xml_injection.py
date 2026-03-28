"""Detect XML injection and XXE attempts."""

import re
import time
from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"<!DOCTYPE\s+[^>]*ENTITY", re.IGNORECASE),
    re.compile(r"<!ENTITY\s+", re.IGNORECASE),
    re.compile(r"<!\[CDATA\[", re.IGNORECASE),
    re.compile(r'SYSTEM\s+["\']file://', re.IGNORECASE),
    re.compile(r'SYSTEM\s+["\']https?://', re.IGNORECASE),
    re.compile(r"<!DOCTYPE\s+\w+\s*\[", re.IGNORECASE),
    re.compile(r"&[a-zA-Z0-9]+;.*&[a-zA-Z0-9]+;.*&[a-zA-Z0-9]+;"),
    re.compile(r"<!ELEMENT\s+", re.IGNORECASE),
    re.compile(r"<!ATTLIST\s+", re.IGNORECASE),
    re.compile(r'xmlns:?\w*\s*=\s*["\'].*["\']', re.IGNORECASE),
]


class _XmlInjection:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "xml-injection"
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
            guard_name="xml-injection",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="XML injection detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def xml_injection(*, action: str = "block") -> _XmlInjection:
    return _XmlInjection(action=action)
