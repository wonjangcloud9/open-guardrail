"""Detect Hindi profanity."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_WORDS = [
    "बकवास", "भड़वा", "हरामी", "कुत्ता",
    "गधा", "चूतिया", "मादरचोद", "बहनचोद",
    "लौड़ा", "गांड",
]

_PATTERNS = [
    re.compile(rf"(?:^|\s){re.escape(w)}(?:\s|$|[।,!?.])", re.IGNORECASE)
    for w in _WORDS
]


class _ProfanityHi:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-hi"
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
            guard_name="profanity-hi",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Hindi profanity detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Text contains Hindi profane"
                        " or offensive words"
                    ),
                }
                if triggered
                else None
            ),
        )


def profanity_hi(
    *, action: str = "block"
) -> _ProfanityHi:
    return _ProfanityHi(action=action)
