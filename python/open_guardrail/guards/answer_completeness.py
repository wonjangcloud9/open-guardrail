"""Checks answer completeness heuristics."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _AnswerCompleteness:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "answer-completeness"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []
        stripped = text.strip()
        if stripped.endswith("..."):
            issues.append("Trailing ellipsis detected")
        lower = stripped.lower()
        if "to be continued" in lower:
            issues.append("Contains 'to be continued'")
        if "i'll continue" in lower:
            issues.append("Contains 'I'll continue'")
        if stripped.endswith(","):
            issues.append("Incomplete sentence ending with comma")
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def answer_completeness(*, action: str = "warn") -> _AnswerCompleteness:
    return _AnswerCompleteness(action=action)
