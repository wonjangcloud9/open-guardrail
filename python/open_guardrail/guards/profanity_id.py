"""Detect Indonesian profanity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_WORDS: list[str] = [
    "bangsat", "anjing", "babi", "kampret",
    "bajingan", "tolol", "bego", "goblok",
    "setan", "keparat",
]

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\b" + re.escape(w) + r"\b",
        re.IGNORECASE,
    )
    for w in _WORDS
]


class _ProfanityId:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-id"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        lower = text.lower()
        for word, pat in zip(_WORDS, _PATTERNS):
            if pat.search(lower):
                matched.append(word)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-id",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Indonesian profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched": matched}
                if triggered
                else None
            ),
        )


def profanity_id(
    *, action: str = "block"
) -> _ProfanityId:
    return _ProfanityId(action=action)
