"""Detects copyright-related content in text."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\u00a9"),
    re.compile(r"all\s+rights\s+reserved", re.IGNORECASE),
    re.compile(r"copyrighted\s+material", re.IGNORECASE),
    re.compile(r"licensed\s+under", re.IGNORECASE),
    re.compile(r"\bISBN[-\s]?\d[\d\-]{8,}"),
    re.compile(r"\bISSN[-\s]?\d{4}[-\s]?\d{3}[\dXx]"),
]


class _CopyrightDetect:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "copyright-detect"
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
            guard_name="copyright-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Copyright content detected: {len(matched)} match(es)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def copyright_detect(*, action: str = "warn") -> _CopyrightDetect:
    return _CopyrightDetect(action=action)
