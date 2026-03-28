"""Turkish profanity detection guard."""

import re
import time

from open_guardrail.core import GuardResult

_WORDS = [
    "amk", "orospu", "siktir", "piç", "göt",
    "yarrak", "sikerim", "bok", "hıyar", "anan",
]

_PATTERNS = [
    re.compile(
        r"(?:^|\s)" + re.escape(w) + r"(?:\s|$)",
        re.IGNORECASE,
    )
    for w in _WORDS
]


class _ProfanityTr:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-tr"
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
            guard_name="profanity-tr",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Turkish profanity detected: {len(matched)}"
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


def profanity_tr(
    *, action: str = "block"
) -> _ProfanityTr:
    return _ProfanityTr(action=action)
