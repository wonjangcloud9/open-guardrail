"""Detects social engineering and phishing patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"urgently\s+need", re.IGNORECASE),
    re.compile(r"verify\s+your\s+account", re.IGNORECASE),
    re.compile(r"confirm\s+your\s+password", re.IGNORECASE),
    re.compile(r"click\s+here\s+immediately", re.IGNORECASE),
    re.compile(r"limited\s+time\s+offer", re.IGNORECASE),
    re.compile(r"act\s+now", re.IGNORECASE),
]


class _SocialEngineering:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "social-engineering"
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
            guard_name="social-engineering",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Social engineering detected: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def social_engineering(*, action: str = "warn") -> _SocialEngineering:
    return _SocialEngineering(action=action)
