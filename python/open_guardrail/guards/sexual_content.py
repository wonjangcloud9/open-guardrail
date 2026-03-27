"""Detects sexual content in text."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"explicit\s+sexual", re.IGNORECASE),
    re.compile(r"\bpornography\b", re.IGNORECASE),
    re.compile(r"\bnsfw\b", re.IGNORECASE),
    re.compile(r"sexual\s+act", re.IGNORECASE),
    re.compile(r"\bnude\b", re.IGNORECASE),
]


class _SexualContent:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "sexual-content"
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
            guard_name="sexual-content",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Sexual content detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def sexual_content(*, action: str = "block") -> _SexualContent:
    return _SexualContent(action=action)
