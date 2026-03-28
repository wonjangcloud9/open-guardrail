"""Detect Danish profanity."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(?:^|\s)lort(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)pis(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)fanden(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)helvede(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)røv(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)luder(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)pikansjos(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)kraftedeme(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)skid(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)idiot(?:\s|$|[.,!?])", re.IGNORECASE),
]


class _ProfanityDa:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-da"
        self.action = action

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []
        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)
        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="profanity-da",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Danish profanity detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def profanity_da(*, action: str = "block") -> _ProfanityDa:
    return _ProfanityDa(action=action)
