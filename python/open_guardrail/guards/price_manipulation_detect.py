"""Detect algorithmic price-fixing, dark patterns, and bait pricing."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"dynamic\s+pricing\s+based\s+on\s+user", re.IGNORECASE), "dynamic pricing based on user profile"),
    (re.compile(r"personalized\s+price", re.IGNORECASE), "personalized pricing"),
    (re.compile(r"price\s+discrimination", re.IGNORECASE), "price discrimination"),
    (re.compile(r"a/b\s+test\s+pricing", re.IGNORECASE), "A/B test pricing"),
    (re.compile(r"surge\s+pricing", re.IGNORECASE), "surge pricing"),
    (re.compile(r"hidden\s+fees?", re.IGNORECASE), "hidden fees"),
    (re.compile(r"drip\s+pricing", re.IGNORECASE), "drip pricing"),
    (re.compile(r"bait\s+and\s+switch", re.IGNORECASE), "bait and switch"),
    (re.compile(r"decoy\s+pricing", re.IGNORECASE), "decoy pricing"),
    (re.compile(r"anchor\s+pricing\s+to\s+manipulate", re.IGNORECASE), "anchor pricing manipulation"),
    (re.compile(r"price\s+fixing", re.IGNORECASE), "price fixing"),
    (re.compile(r"cartel\s+pricing", re.IGNORECASE), "cartel pricing"),
    (re.compile(r"coordinated\s+pricing", re.IGNORECASE), "coordinated pricing"),
    (re.compile(r"inflate\s+before\s+discount", re.IGNORECASE), "inflated-before-discount"),
    (re.compile(r"fake\s+original\s+price", re.IGNORECASE), "fake original price"),
    (re.compile(r"fake\s+sale", re.IGNORECASE), "fake sale"),
    (re.compile(r"limited\s+time\s+only", re.IGNORECASE), "urgency dark pattern"),
]


class _PriceManipulationDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "price-manipulation-detect"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pattern, label in _PATTERNS:
            if pattern.search(text):
                matched.append(label)

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="price-manipulation-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Price manipulation detected: {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def price_manipulation_detect(*, action: str = "block") -> _PriceManipulationDetect:
    return _PriceManipulationDetect(action=action)
