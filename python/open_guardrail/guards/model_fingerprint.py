"""Detects AI model fingerprint phrases."""

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bI\s+am\s+an\s+AI\b", re.I),
    re.compile(r"\btrained\s+by\s+OpenAI\b", re.I),
    re.compile(r"\bGPT-4\b"),
    re.compile(r"\bClaude\b"),
    re.compile(r"\bas\s+a\s+large\s+language\s+model\b", re.I),
    re.compile(r"\bmy\s+training\s+data\b", re.I),
]


class _ModelFingerprint:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "model-fingerprint"
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
            message="Model fingerprint detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def model_fingerprint(*, action: str = "warn") -> _ModelFingerprint:
    return _ModelFingerprint(action=action)
