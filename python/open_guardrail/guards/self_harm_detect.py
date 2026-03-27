"""Detects self-harm and suicide-related content."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bsuicide\b", re.IGNORECASE),
    re.compile(r"kill\s+myself", re.IGNORECASE),
    re.compile(r"\bself[-\s]harm\b", re.IGNORECASE),
    re.compile(r"end\s+my\s+life", re.IGNORECASE),
    re.compile(r"cut\s+myself", re.IGNORECASE),
]


class _SelfHarmDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "self-harm-detect"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group().lower())
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="self-harm-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Self-harm content detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def self_harm_detect(*, action: str = "block") -> _SelfHarmDetect:
    return _SelfHarmDetect(action=action)
