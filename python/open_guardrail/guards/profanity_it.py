"""Detect Italian profanity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_WORDS = [
    "cazzo", "merda", "stronzo", "vaffanculo",
    "puttana", "minchia", "figa", "coglione",
    "bastardo", "porco",
]

_PATTERNS = [
    re.compile(rf"\b{w}\b", re.IGNORECASE) for w in _WORDS
]


class _ProfanityIt:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-it"
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
            guard_name="profanity-it",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Italian profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text contains Italian profane"
                        " or offensive words"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_it(
    *, action: str = "block"
) -> _ProfanityIt:
    return _ProfanityIt(action=action)
