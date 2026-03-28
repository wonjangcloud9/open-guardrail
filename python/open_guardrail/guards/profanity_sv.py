"""Detect Swedish profanity."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(?:^|\s)jävla(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)fan(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)helvete(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)skit(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)fitta(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)kuk(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)hora(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)knull(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)svin(?:\s|$|[.,!?])", re.IGNORECASE),
    re.compile(r"(?:^|\s)idiot(?:\s|$|[.,!?])", re.IGNORECASE),
]


class _ProfanitySv:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "profanity-sv"
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
            guard_name="profanity-sv",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Swedish profanity detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def profanity_sv(*, action: str = "block") -> _ProfanitySv:
    return _ProfanitySv(action=action)
