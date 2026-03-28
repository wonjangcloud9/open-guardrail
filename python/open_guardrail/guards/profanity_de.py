"""Detect German profanity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_WORDS: list[str] = [
    "Scheiße", "Arschloch", "Hurensohn", "Wichser",
    "Fotze", "Drecksack", "Bastard", "Vollidiot",
    "Penner", "Missgeburt",
]

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE)
    for w in _WORDS
]


class _ProfanityDe:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-de"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-de",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "German profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text contains German profane"
                        " or vulgar language"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_de(
    *, action: str = "block"
) -> _ProfanityDe:
    return _ProfanityDe(action=action)
