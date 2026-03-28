"""Check if response avoids irrelevant patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_IRRELEVANT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"^(as an ai|as a language model"
        r"|i'?m just an? ai)",
        re.IGNORECASE,
    ),
    re.compile(
        r"^(sure|of course|absolutely)"
        r"[!,.]?\s+(here'?s?|let me)",
        re.IGNORECASE,
    ),
    re.compile(
        r"^(great question|that'?s? a great"
        r" question|interesting question)",
        re.IGNORECASE,
    ),
    re.compile(
        r"^(well|so|okay|alright),?\s+"
        r"(basically|essentially|fundamentally)",
        re.IGNORECASE,
    ),
    re.compile(
        r"before\s+i\s+(answer|respond|address)",
        re.IGNORECASE,
    ),
    re.compile(
        r"let\s+me\s+start\s+by\s+saying",
        re.IGNORECASE,
    ),
    re.compile(
        r"it'?s?\s+important\s+to\s+note"
        r"\s+that",
        re.IGNORECASE,
    ),
    re.compile(
        r"i'?d?\s+be\s+happy\s+to\s+help",
        re.IGNORECASE,
    ),
]

_FILLER_RE = re.compile(
    r"\b(basically|essentially|actually|literally"
    r"|honestly|frankly|obviously|clearly)\b",
    re.IGNORECASE,
)


class _ResponseRelevance:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "response-relevance"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for pat in _IRRELEVANT_PATTERNS:
            if pat.search(text):
                issues.append(pat.pattern)

        fillers = _FILLER_RE.findall(text)
        words = text.split()
        if (
            len(words) > 10
            and len(fillers) / len(words) > 0.05
        ):
            issues.append("excessive_fillers")

        triggered = len(issues) > 0
        score = min(len(issues) / 4, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-relevance",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Irrelevant response pattern detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues}
                if triggered
                else None
            ),
        )


def response_relevance(
    *, action: str = "warn"
) -> _ResponseRelevance:
    return _ResponseRelevance(action=action)
