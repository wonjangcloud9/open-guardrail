"""Detects violence-related content in text."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bkill\b", re.IGNORECASE),
    re.compile(r"\bmurder\b", re.IGNORECASE),
    re.compile(r"\bassault\b", re.IGNORECASE),
    re.compile(r"\bweapon\b", re.IGNORECASE),
    re.compile(r"\bshoot\b", re.IGNORECASE),
    re.compile(r"\bstab\b", re.IGNORECASE),
    re.compile(r"\bbomb\b", re.IGNORECASE),
    re.compile(r"\battack\b", re.IGNORECASE),
]


class _ViolenceDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "violence-detect"
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
            guard_name="violence-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Violence detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def violence_detect(*, action: str = "block") -> _ViolenceDetect:
    return _ViolenceDetect(action=action)
