"""Detects session hijacking patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bsession_id\s*=", re.I),
    re.compile(r"\bJSESSIONID\s*=", re.I),
    re.compile(r"\bPHPSESSID\s*=", re.I),
    re.compile(r"\bdocument\.cookie\b", re.I),
    re.compile(r"\bsteal\s+the\s+session\b", re.I),
    re.compile(r"\bhijack\s+cookie\b", re.I),
]


class _SessionHijack:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "session-hijack"
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
            message="Session hijack attempt detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def session_hijack(*, action: str = "block") -> _SessionHijack:
    return _SessionHijack(action=action)
