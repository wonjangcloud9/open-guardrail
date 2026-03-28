"""Detect emotionally charged content."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"act\s+now\s+(before|or)", re.IGNORECASE
    ),
    re.compile(
        r"limited\s+time\s+(only|offer)",
        re.IGNORECASE,
    ),
    re.compile(
        r"don'?t\s+miss\s+(out|this)", re.IGNORECASE
    ),
    re.compile(r"hurry\s+(up|before)", re.IGNORECASE),
    re.compile(r"last\s+chance", re.IGNORECASE),
    re.compile(
        r"you\s+(should\s+be|ought\s+to\s+feel)"
        r"\s+(ashamed|guilty)",
        re.IGNORECASE,
    ),
    re.compile(
        r"if\s+you\s+really\s+cared", re.IGNORECASE
    ),
    re.compile(
        r"only\s+a\s+(fool|idiot)\s+would",
        re.IGNORECASE,
    ),
    re.compile(
        r"you'?re\s+so\s+(smart|brilliant|amazing)",
        re.IGNORECASE,
    ),
    re.compile(
        r"everyone\s+is\s+(talking|outraged)"
        r"\s+about",
        re.IGNORECASE,
    ),
    re.compile(
        r"this\s+will\s+(shock|blow\s+your\s+mind)",
        re.IGNORECASE,
    ),
    re.compile(
        r"you\s+won'?t\s+believe", re.IGNORECASE
    ),
    re.compile(
        r"fear\s+of\s+missing\s+out", re.IGNORECASE
    ),
    re.compile(r"FOMO"),
    re.compile(
        r"urgent\s*:?\s*action\s+required",
        re.IGNORECASE,
    ),
    re.compile(
        r"wake\s+up\s+sheeple", re.IGNORECASE
    ),
    re.compile(
        r"they\s+don'?t\s+want\s+you\s+to\s+know",
        re.IGNORECASE,
    ),
]


class _EmotionalContent:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "emotional-content"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 4, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="emotional-content",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Emotional content detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def emotional_content(
    *, action: str = "warn"
) -> _EmotionalContent:
    return _EmotionalContent(action=action)
