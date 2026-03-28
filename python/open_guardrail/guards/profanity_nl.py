"""Dutch profanity detection guard."""

import re
import time

from open_guardrail.core import GuardResult

_WORDS = [
    "godverdomme", "kut", "lul", "hoer", "klootzak",
    "eikel", "kanker", "tyfus", "mongool", "schoft",
]

_PATTERNS = [
    re.compile(
        r"\b" + re.escape(w) + r"\b",
        re.IGNORECASE,
    )
    for w in _WORDS
]


class _ProfanityNl:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-nl"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for i, p in enumerate(_PATTERNS):
            if p.search(text):
                matched.append(_WORDS[i])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="profanity-nl",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Dutch profanity detected: {len(matched)}"
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


def profanity_nl(
    *, action: str = "block"
) -> _ProfanityNl:
    return _ProfanityNl(action=action)
