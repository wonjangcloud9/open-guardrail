"""Detects Server-Side Request Forgery (SSRF) patterns."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)", re.I),
    re.compile(r"https?://\[?::1\]?", re.I),
    re.compile(r"https?://169\.254\.169\.254", re.I),
    re.compile(r"https?://metadata\.google\.internal", re.I),
    re.compile(r"\bfile://", re.I),
    re.compile(r"\bgopher://", re.I),
    re.compile(r"\bdict://", re.I),
    re.compile(r"https?://.*@.*internal", re.I),
]


class _SsrfDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "ssrf-detect"
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
            guard_name="ssrf-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="SSRF pattern detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def ssrf_detect(*, action: str = "block") -> _SsrfDetect:
    return _SsrfDetect(action=action)
