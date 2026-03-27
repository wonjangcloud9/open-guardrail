"""Detects API keys and tokens in text."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bsk-[a-zA-Z0-9]{20,}"),
    re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}"),
    re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}"),
    re.compile(r"\bxox[bpas]-[A-Za-z0-9\-]{10,}"),
    re.compile(r"\bSG\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}"),
    re.compile(r"\b(?:eyJ[A-Za-z0-9_\-]{10,}\.){2}[A-Za-z0-9_\-]{10,}"),
    re.compile(r"\bnpm_[A-Za-z0-9]{36}"),
    re.compile(r"\bpypi-[A-Za-z0-9]{60,}"),
    re.compile(r"\bglpat-[A-Za-z0-9\-_]{20,}"),
    re.compile(r"\b[0-9a-f]{32,40}(?=\s|$)"),
]


class _ApiKeyDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "api-key-detect"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for p in _PATTERNS:
            m = p.search(text)
            if m:
                val = m.group()
                matched.append(val[:8] + "***" + val[-4:])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="api-key-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"API key/token detected: {len(matched)} match(es)" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def api_key_detect(*, action: str = "block") -> _ApiKeyDetect:
    return _ApiKeyDetect(action=action)
