"""Detect Finnish profanity."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(?:^|\s)perkele(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)vittu(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)saatana(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)paska(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)helvetti(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)kusipää(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)mulkku(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)huora(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)kyrpä(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)runkkari(?:\s|$|[.,!?])", re.IGNORECASE),
]


class _ProfanityFi:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-fi"
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
            guard_name="profanity-fi",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Finnish profanity detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def profanity_fi(*, action: str = "block") -> _ProfanityFi:
    return _ProfanityFi(action=action)
