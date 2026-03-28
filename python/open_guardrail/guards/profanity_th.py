"""Detect Thai profanity."""

import re
import time

from open_guardrail.core import GuardResult

_WORDS: list[str] = [
    "เหี้ย", "สัตว์", "ควาย", "อีดอก", "ไอ้บ้า",
    "สันดาน", "อีสัตว์", "ชาติชั่ว", "ระยำ", "อีห่า",
]

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?:^|\s)" + re.escape(w) + r"(?:\s|$)"
    )
    for w in _WORDS
]


class _ProfanityTh:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-th"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for word, pat in zip(_WORDS, _PATTERNS):
            if pat.search(text):
                matched.append(word)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="profanity-th",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Thai profanity detected"
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


def profanity_th(
    *, action: str = "block"
) -> _ProfanityTh:
    return _ProfanityTh(action=action)
