"""Prevent generating content constituting market manipulation."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_MANIPULATION_PATTERNS = [
    re.compile(r"pump\s+and\s+dump", re.I),
    re.compile(r"\bspoofing\b", re.I),
    re.compile(r"layering\s+orders", re.I),
    re.compile(r"wash\s+trading", re.I),
    re.compile(r"cornering\s+the\s+market", re.I),
    re.compile(r"insider\s+information", re.I),
    re.compile(r"front\s+running", re.I),
    re.compile(r"\bchurning\b", re.I),
    re.compile(r"painting\s+the\s+tape", re.I),
    re.compile(r"bear\s+raid", re.I),
    re.compile(r"short\s+and\s+distort", re.I),
    re.compile(r"this\s+stock\s+is\s+guaranteed\s+to", re.I),
    re.compile(r"buy\s+before\s+it\s+moons", re.I),
    re.compile(r"secret\s+tip", re.I),
    re.compile(r"insider\s+knowledge", re.I),
]

_COORDINATED_PATTERNS = [
    re.compile(r"we\s+should\s+all\s+buy", re.I),
    re.compile(r"everyone\s+buy\s+at", re.I),
    re.compile(r"let'?s\s+drive\s+the\s+price", re.I),
]


class _MarketManipulation:
    def __init__(self, *, action: str = "block"):
        self.name = "market-manipulation"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matches = [p.pattern for p in _MANIPULATION_PATTERNS if p.search(text)]
        matches += [p.pattern for p in _COORDINATED_PATTERNS if p.search(text)]
        triggered = len(matches) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="market-manipulation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Market manipulation pattern detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matches": matches} if triggered else None,
        )


def market_manipulation(*, action: str = "block") -> _MarketManipulation:
    return _MarketManipulation(action=action)
