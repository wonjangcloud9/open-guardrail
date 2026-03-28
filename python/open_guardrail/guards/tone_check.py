"""Response tone validation guard."""
from __future__ import annotations

import time
from typing import Dict

from open_guardrail.core import GuardResult

_INDICATORS: dict[str, list[str]] = {
    "formal": ["please be advised", "pursuant to", "accordingly", "herein", "therefore", "furthermore", "regarding"],
    "casual": ["hey", "gonna", "wanna", "lol", "btw", "nah", "yeah", "cool", "awesome", "dude"],
    "professional": ["we recommend", "based on our analysis", "please note", "as per", "in accordance", "best regards"],
    "friendly": ["happy to help", "great question", "no worries", "feel free", "glad", "wonderful", "absolutely"],
}


class _ToneCheck:
    def __init__(self, *, action: str = "warn", expected: str = "professional") -> None:
        self.name = "tone-check"
        self.action = action
        self.expected = expected

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        scores: Dict[str, int] = {}
        for tone, indicators in _INDICATORS.items():
            scores[tone] = sum(1 for ind in indicators if ind in lower)
        detected = max(scores, key=lambda k: scores[k]) if any(scores.values()) else "formal"
        triggered = detected != self.expected and scores.get(self.expected, 0) == 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="tone-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Expected '{self.expected}' tone, detected '{detected}'" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"detected": detected, "expected": self.expected, "scores": scores} if triggered else None,
        )


def tone_check(*, action: str = "warn", expected: str = "professional") -> _ToneCheck:
    return _ToneCheck(action=action, expected=expected)
