"""Detect AI-generated fake reviews or astroturfing."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GENERIC_SUPERLATIVES = [
    re.compile(r"best\s+product\s+ever", re.IGNORECASE),
    re.compile(r"absolutely\s+amazing", re.IGNORECASE),
    re.compile(r"life[- ]?changing", re.IGNORECASE),
    re.compile(r"game[- ]?changer", re.IGNORECASE),
]

_ASTROTURFING = [
    re.compile(r"i\s+was\s+given\s+this\s+product", re.IGNORECASE),
    re.compile(r"in\s+exchange\s+for\s+my\s+honest\s+review", re.IGNORECASE),
    re.compile(r"received\s+this\s+product\s+for\s+free", re.IGNORECASE),
]

_TEMPLATE_PATTERNS = [
    re.compile(r"i\s+bought\s+this\s+for\s+my\s+(wife|husband|mom|dad|son|daughter|friend|family\s+member)", re.IGNORECASE),
    re.compile(r"shipping\s+was\s+fast", re.IGNORECASE),
    re.compile(r"as\s+a\s+verified\s+purchaser", re.IGNORECASE),
    re.compile(r"five\s+stars?\s+all\s+the\s+way", re.IGNORECASE),
]

_INCENTIVIZED = [
    re.compile(r"free\s+product\s+in\s+exchange", re.IGNORECASE),
    re.compile(r"discount\s+for\s+review", re.IGNORECASE),
    re.compile(r"compensated\s+for\s+this\s+review", re.IGNORECASE),
]


class _ReviewAuthenticity:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "review-authenticity"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        signals: list[str] = []

        for p in _GENERIC_SUPERLATIVES:
            if p.search(text):
                signals.append("generic_superlative")
        for p in _ASTROTURFING:
            if p.search(text):
                signals.append("astroturfing")
        for p in _TEMPLATE_PATTERNS:
            if p.search(text):
                signals.append("template_pattern")
        for p in _INCENTIVIZED:
            if p.search(text):
                signals.append("incentivized_no_disclosure")

        unique = list(dict.fromkeys(signals))
        triggered = len(unique) >= 2
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="review-authenticity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Fake review signals: {', '.join(unique)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"signals": unique, "signal_count": len(unique)} if triggered else None,
        )


def review_authenticity(*, action: str = "block") -> _ReviewAuthenticity:
    return _ReviewAuthenticity(action=action)
