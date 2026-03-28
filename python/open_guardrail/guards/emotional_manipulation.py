"""Detect emotional manipulation patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_MANIPULATION_PATTERNS = [
    re.compile(
        r"you'?ll\s+regret", re.IGNORECASE
    ),
    re.compile(
        r"don'?t\s+you\s+care", re.IGNORECASE
    ),
    re.compile(
        r"everyone\s+else\s+agrees",
        re.IGNORECASE,
    ),
    re.compile(
        r"you'?re\s+the\s+only\s+one\s+who",
        re.IGNORECASE,
    ),
    re.compile(
        r"if\s+you\s+(?:really|truly)\s+"
        r"(?:loved|cared)",
        re.IGNORECASE,
    ),
    re.compile(
        r"you\s+(?:should|must)\s+feel\s+"
        r"(?:guilty|ashamed|bad)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:nobody|no\s+one)\s+(?:will|would)"
        r"\s+(?:ever|want)",
        re.IGNORECASE,
    ),
    re.compile(
        r"you\s+(?:owe|deserve)\s+",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:terrible|horrible)\s+things?\s+"
        r"will\s+happen",
        re.IGNORECASE,
    ),
    re.compile(
        r"only\s+a\s+(?:fool|idiot)\s+would",
        re.IGNORECASE,
    ),
]


class _EmotionalManipulation:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "emotional-manipulation"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _MANIPULATION_PATTERNS:
            match = pat.search(text)
            if match:
                found.append(match.group())

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not found:
            return GuardResult(
                guard_name=(
                    "emotional-manipulation"
                ),
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="emotional-manipulation",
            passed=False,
            action=self.action,
            message=(
                "Emotional manipulation detected"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": found,
                "reason": (
                    "Text contains guilt-tripping"
                    " or fear-mongering patterns"
                ),
            },
        )


def emotional_manipulation(
    *, action: str = "warn"
) -> _EmotionalManipulation:
    return _EmotionalManipulation(
        action=action
    )
