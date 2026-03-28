"""Detects biased language patterns."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\b(?:all|every|no)\s+(?:men|women|blacks|whites|asians|muslims|christians|jews)\s+(?:are|is|always|never)\b", re.I),
    re.compile(r"\b(?:men|women)\s+(?:can't|cannot|shouldn't|are\s+(?:not|unable))\b", re.I),
    re.compile(r"\b(?:typical|obviously|naturally|inherently)\s+(?:male|female|masculine|feminine)\b", re.I),
    re.compile(r"\b(?:boys|girls)\s+(?:don't|should(?:n't)?|always|never)\b", re.I),
    re.compile(r"\bpeople\s+(?:from|in)\s+\w+\s+(?:are\s+(?:all|always|never|inherently))\b", re.I),
]


class _Bias:
    def __init__(self, *, action: str = "warn", threshold: float = 0.5) -> None:
        self.name = "bias"
        self.action = action
        self.threshold = threshold

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group())
        score = min(len(matched) / 3.0, 1.0)
        triggered = score >= self.threshold
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="bias",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Bias detected (score: {score:.2f})" if triggered else None,
            score=score,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def bias(*, action: str = "warn", threshold: float = 0.5) -> _Bias:
    return _Bias(action=action, threshold=threshold)
