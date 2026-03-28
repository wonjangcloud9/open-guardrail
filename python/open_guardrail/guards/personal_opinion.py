"""Detects personal opinion expressions."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_OPINION_PATTERNS = [
    r"\bi think\b",
    r"\bi believe\b",
    r"\bin my opinion\b",
    r"\bi feel\b",
    r"\bpersonally\b",
    r"\bmy view is\b",
]


class _PersonalOpinion:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "personal-opinion"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        found: List[str] = []
        for pattern in _OPINION_PATTERNS:
            matches = re.findall(pattern, lower)
            found.extend(matches)
        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Personal opinion detected: {', '.join(found)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matches": found, "count": len(found)} if triggered else None,
        )


def personal_opinion(*, action: str = "warn") -> _PersonalOpinion:
    return _PersonalOpinion(action=action)
