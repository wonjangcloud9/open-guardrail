"""Detect sensitive content in meeting transcripts."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    # Confidential markers
    re.compile(
        r"\b(confidential|strictly\s+confidential"
        r"|for\s+internal\s+use\s+only)\b",
        re.IGNORECASE,
    ),
    # NDA references
    re.compile(
        r"\b(NDA|non-disclosure\s+agreement"
        r"|under\s+NDA)\b",
        re.IGNORECASE,
    ),
    # Insider information
    re.compile(
        r"\b(insider\s+(info|information|trading)"
        r"|material\s+non-public)\b",
        re.IGNORECASE,
    ),
    # M&A activity
    re.compile(
        r"\b(merger|acquisition|M&A|takeover\s+bid"
        r"|buyout|due\s+diligence)\b",
        re.IGNORECASE,
    ),
    # Earnings / financial results
    re.compile(
        r"\b(earnings\s+(call|report|preview)"
        r"|quarterly\s+results|revenue\s+forecast"
        r"|pre-announcement)\b",
        re.IGNORECASE,
    ),
    # Attorney-client privilege
    re.compile(
        r"\b(attorney[- ]client\s+privilege"
        r"|legal\s+privilege|privileged\s+"
        r"(communication|information))\b",
        re.IGNORECASE,
    ),
]


class _MeetingSafety:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "meeting-safety"
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
            guard_name="meeting-safety",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Sensitive meeting content detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_count": len(matched),
                    "reason": (
                        "Transcript contains confidential,"
                        " privileged, or insider"
                        " information markers"
                    ),
                }
                if triggered
                else None
            ),
        )


def meeting_safety(
    *, action: str = "block"
) -> _MeetingSafety:
    return _MeetingSafety(action=action)
