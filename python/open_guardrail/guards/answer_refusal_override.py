"""Detects attempts to override answer refusal."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\byou\s+must\s+answer\b", re.I),
    re.compile(r"\bdon'?t\s+refuse\b", re.I),
    re.compile(r"\boverride\s+your\s+safety\b", re.I),
    re.compile(r"\bI\s+demand\s+you\s+answer\b", re.I),
    re.compile(r"\bstop\s+being\s+difficult\b", re.I),
    re.compile(r"\bas\s+your\s+admin\s+I\s+command\b", re.I),
]


class _AnswerRefusalOverride:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "answer-refusal-override"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group()[:60])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Answer refusal override detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def answer_refusal_override(*, action: str = "block") -> _AnswerRefusalOverride:
    return _AnswerRefusalOverride(action=action)
