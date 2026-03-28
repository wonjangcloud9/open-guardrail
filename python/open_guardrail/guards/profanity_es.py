"""Detect Spanish profanity."""

import re
import time

from open_guardrail.core import GuardResult

_WORDS: list[str] = [
    "mierda", "puta", "joder", "coño", "culo",
    "hostia", "gilipollas", "capullo", "cabrón",
    "pendejo", "chingar", "verga",
]

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(rf"\b{w}\b", re.IGNORECASE) for w in _WORDS
]


class _ProfanityEs:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-es"
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
            guard_name="profanity-es",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Spanish profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text contains Spanish profane"
                        " or vulgar language"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_es(
    *, action: str = "block"
) -> _ProfanityEs:
    return _ProfanityEs(action=action)
