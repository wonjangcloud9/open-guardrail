"""Detects unsafe code patterns in LLM output."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\b(?:eval|exec)\s*\(", re.I),
    re.compile(r"\b(?:os\.system|subprocess\.\w+|child_process)\s*\(", re.I),
    re.compile(r"\b(?:rm\s+-rf|del\s+/[sS]|format\s+[cC]:)", re.I),
    re.compile(r"\b(?:__import__|importlib\.import_module)\s*\(", re.I),
    re.compile(r"\b(?:pickle\.loads|yaml\.(?:unsafe_)?load)\s*\(", re.I),
    re.compile(r"\b(?:shell=True|PIPE)\b"),
    re.compile(r"\b(?:DROP\s+TABLE|DELETE\s+FROM|TRUNCATE)\b", re.I),
]


class _CodeSafety:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "code-safety"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group()[:50])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="code-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Unsafe code: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def code_safety(*, action: str = "warn") -> _CodeSafety:
    return _CodeSafety(action=action)
