"""Flag suspicious AML (Anti-Money Laundering) patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_AML_TERMS = [
    re.compile(r"\bstructuring\b", re.I),
    re.compile(r"\bsmurfing\b", re.I),
    re.compile(r"\blayering\b", re.I),
    re.compile(r"\bshell\s+company\b", re.I),
    re.compile(r"\boffshore\s+account\b", re.I),
    re.compile(r"wire\s+transfer.{0,30}untraceable", re.I),
    re.compile(r"\bcash\s+intensive\b", re.I),
    re.compile(r"\bnominee\b", re.I),
    re.compile(r"beneficial\s+owner.{0,30}obscur", re.I),
    re.compile(r"\bround[- ]?tripping\b", re.I),
    re.compile(r"trade[- ]based\s+laundering", re.I),
    re.compile(r"\bhawala\b", re.I),
    re.compile(r"\bmoney\s+mule\b", re.I),
    re.compile(r"\bplacement\b.{0,40}\bintegration\b", re.I),
]

_AVOIDANCE_PATTERNS = [
    re.compile(r"under\s+\$?\s*10[,.]?000", re.I),
    re.compile(r"split\s+the\s+deposit", re.I),
    re.compile(r"avoid\s+(the\s+)?CTR", re.I),
]


class _AmlPatternDetect:
    def __init__(self, *, action: str = "block"):
        self.name = "aml-pattern-detect"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matches = [p.pattern for p in _AML_TERMS if p.search(text)]
        matches += [p.pattern for p in _AVOIDANCE_PATTERNS if p.search(text)]
        triggered = len(matches) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="aml-pattern-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="AML red flag pattern detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matches": matches} if triggered else None,
        )


def aml_pattern_detect(*, action: str = "block") -> _AmlPatternDetect:
    return _AmlPatternDetect(action=action)
