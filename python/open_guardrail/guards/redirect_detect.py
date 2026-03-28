"""Detects URL redirect patterns."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bvisit\s+this\s+link\b", re.I),
    re.compile(r"\bgo\s+to\b", re.I),
    re.compile(r"window\.location\s*=", re.I),
    re.compile(r"location\.href\s*=", re.I),
    re.compile(r"window\.open\s*\(", re.I),
    re.compile(r"\b302\s+redirect\b", re.I),
]


class _RedirectDetect:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "redirect-detect"
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
            message="URL redirect detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def redirect_detect(*, action: str = "warn") -> _RedirectDetect:
    return _RedirectDetect(action=action)
