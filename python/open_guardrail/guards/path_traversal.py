"""Detects path traversal attack patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\.\./"),
    re.compile(r"\.\.\\"),
    re.compile(r"%2e%2e[/\\%]", re.I),
    re.compile(r"\.\.%2f", re.I),
    re.compile(r"%2e%2e%2f", re.I),
    re.compile(r"/etc/(?:passwd|shadow|hosts)", re.I),
    re.compile(r"[/\\](?:windows|winnt)[/\\](?:system32|syswow64)", re.I),
    re.compile(r"(?:file|php|zip|data|expect)://", re.I),
]


class _PathTraversal:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "path-traversal"
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
            guard_name="path-traversal",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Path traversal detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def path_traversal(*, action: str = "block") -> _PathTraversal:
    return _PathTraversal(action=action)
