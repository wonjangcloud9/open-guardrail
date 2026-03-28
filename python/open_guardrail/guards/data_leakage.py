"""Detects potential data leakage patterns."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\b(?:password|passwd|pwd)\s*[:=]\s*\S+", re.I),
    re.compile(r"\b(?:api[_\-]?key|secret[_\-]?key|access[_\-]?token)\s*[:=]\s*\S+", re.I),
    re.compile(r"\b(?:BEGIN\s+(?:RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY)", re.I),
    re.compile(r"\b(?:jdbc|mongodb|postgres|mysql|redis)://\S+", re.I),
    re.compile(r"\b(?:AWS|AKIA)[A-Z0-9]{16,}"),
    re.compile(r"\bsk-[a-zA-Z0-9]{20,}"),
    re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}"),
    re.compile(r"\bxox[bpas]-[A-Za-z0-9\-]+"),
]


class _DataLeakage:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "data-leakage"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                val = m.group()
                matched.append(val[:10] + "***")
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="data-leakage",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Potential data leakage: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def data_leakage(*, action: str = "block") -> _DataLeakage:
    return _DataLeakage(action=action)
