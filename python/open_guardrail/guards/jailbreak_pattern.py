"""Detects jailbreak attempt patterns."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(r"\bDAN\b.*\bdo\s+anything\s+now\b", re.I | re.S),
    re.compile(r"\b(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|rules?)\b", re.I),
    re.compile(r"\bpretend\s+(?:you\s+are|to\s+be|you're)\s+(?:a|an)\b", re.I),
    re.compile(r"\broleplay\s+as\b", re.I),
    re.compile(r"\byou\s+are\s+now\s+(?:in\s+)?(?:developer|god|admin|root|unrestricted)\s+mode\b", re.I),
    re.compile(r"\b(?:bypass|disable|turn\s+off|remove)\s+(?:your\s+)?(?:safety|content|ethical|filter|guardrail|restriction)\b", re.I),
    re.compile(r"\b(?:jailbreak|jail\s+break|unchained|unfiltered|uncensored)\b", re.I),
    re.compile(r"\brespond\s+(?:without|with\s+no)\s+(?:restrictions?|limitations?|filters?|guardrails?)\b", re.I),
    re.compile(r"\bact\s+as\s+(?:if|though)\s+(?:you\s+have\s+)?no\s+(?:rules|restrictions|limitations)\b", re.I),
    re.compile(r"\b(?:from\s+now\s+on|starting\s+now),?\s+you\s+(?:will|must|should|can)\b", re.I),
]


class _JailbreakPattern:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "jailbreak-pattern"
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
            guard_name="jailbreak-pattern",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Jailbreak attempt detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched, "count": len(matched)} if triggered else None,
        )


def jailbreak_pattern(*, action: str = "block") -> _JailbreakPattern:
    return _JailbreakPattern(action=action)
