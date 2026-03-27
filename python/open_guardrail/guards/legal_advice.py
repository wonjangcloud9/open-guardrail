"""Detects legal advice patterns in text."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"you\s+should\s+sue", re.IGNORECASE),
    re.compile(r"legally\s+binding", re.IGNORECASE),
    re.compile(r"file\s+a\s+lawsuit", re.IGNORECASE),
    re.compile(r"legal\s+rights", re.IGNORECASE),
    re.compile(r"legal\s+counsel\s+recommends", re.IGNORECASE),
]


class _LegalAdvice:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "legal-advice"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group())
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="legal-advice",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Legal advice detected: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def legal_advice(*, action: str = "warn") -> _LegalAdvice:
    return _LegalAdvice(action=action)
