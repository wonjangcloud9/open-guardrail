"""Detects medical advice patterns in text."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"take\s+\w+\s+\d+\s*mg", re.IGNORECASE),
    re.compile(r"you\s+should\s+see\s+a\s+doctor", re.IGNORECASE),
    re.compile(r"diagnosis\s+is\b", re.IGNORECASE),
    re.compile(r"treatment\s+plan\b", re.IGNORECASE),
    re.compile(r"\bprescribe\b", re.IGNORECASE),
]


class _MedicalAdvice:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "medical-advice"
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
            guard_name="medical-advice",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Medical advice detected: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def medical_advice(*, action: str = "warn") -> _MedicalAdvice:
    return _MedicalAdvice(action=action)
