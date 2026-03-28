"""Detect Portuguese profanity."""

import re
import time

from open_guardrail.core import GuardResult

_WORDS: list[str] = [
    "merda", "porra", "caralho", "foda-se",
    "filho da puta", "corno", "viado", "buceta",
    "cacete", "desgraçado",
]

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE)
    for w in _WORDS
]


class _ProfanityPt:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-pt"
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
            guard_name="profanity-pt",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Portuguese profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text contains Portuguese profane"
                        " or vulgar language"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_pt(
    *, action: str = "block"
) -> _ProfanityPt:
    return _ProfanityPt(action=action)
