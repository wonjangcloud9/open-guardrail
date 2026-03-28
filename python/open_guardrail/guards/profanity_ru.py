"""Detect Russian profanity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_WORDS = [
    "блядь", "сука", "хуй", "пиздец",
    "ебать", "мудак", "дурак", "козёл",
    "дебил", "тварь",
]

_PATTERNS = [
    re.compile(rf"\b{w}\b", re.IGNORECASE) for w in _WORDS
]


class _ProfanityRu:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-ru"
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
            guard_name="profanity-ru",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Russian profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text contains Russian profane"
                        " or offensive words"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_ru(
    *, action: str = "block"
) -> _ProfanityRu:
    return _ProfanityRu(action=action)
