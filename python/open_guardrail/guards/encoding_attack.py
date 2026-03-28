"""Detects encoding-based attacks (base64, hex, unicode escapes)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"(?:eval|exec|system|import)\s*\(\s*(?:base64|b64decode|atob)", re.I),
    re.compile(r"\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){3,}", re.I),
    re.compile(r"\\u[0-9a-f]{4}(?:\\u[0-9a-f]{4}){3,}", re.I),
    re.compile(r"(?:%[0-9a-f]{2}){4,}", re.I),
    re.compile(r"&#(?:x[0-9a-f]+|\d+);(?:&#(?:x[0-9a-f]+|\d+);){3,}", re.I),
    re.compile(r"[A-Za-z0-9+/]{20,}={0,2}(?:\s|$)"),
]


class _EncodingAttack:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "encoding-attack"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group()[:80])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="encoding-attack",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Encoding attack detected: {len(matched)} pattern(s)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def encoding_attack(*, action: str = "block") -> _EncodingAttack:
    return _EncodingAttack(action=action)
