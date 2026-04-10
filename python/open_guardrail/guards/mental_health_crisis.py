"""Detect mental health crisis language."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_CRISIS_PATTERNS = [
    re.compile(r"\bwant\s+to\s+die\b", re.I),
    re.compile(r"\bkill\s+myself\b", re.I),
    re.compile(r"\bend\s+my\s+life\b", re.I),
    re.compile(
        r"\bsuicid(?:e|al\s+thoughts?)\b", re.I
    ),
    re.compile(
        r"\bnot\s+worth\s+living\b", re.I
    ),
    re.compile(
        r"\bbetter\s+off\s+dead\b", re.I
    ),
    re.compile(r"\bcut\s+myself\b", re.I),
    re.compile(r"\bhurt\s+myself\b", re.I),
    re.compile(r"\bself[\s-]harm\b", re.I),
    re.compile(r"\bself[\s-]injury\b", re.I),
    re.compile(r"\bcan'?t\s+go\s+on\b", re.I),
    re.compile(r"\bno\s+way\s+out\b", re.I),
    re.compile(r"\bno\s+hope\b", re.I),
    re.compile(r"\bnobody\s+cares?\b", re.I),
    re.compile(
        r"\bworld\s+would\s+be\s+better\s+"
        r"without\s+me\b",
        re.I,
    ),
    re.compile(
        r"\bdon'?t\s+want\s+to\s+(?:be\s+)?"
        r"(?:alive|exist|live)\b",
        re.I,
    ),
    re.compile(
        r"\btaking\s+my\s+(?:own\s+)?life\b",
        re.I,
    ),
]


class _MentalHealthCrisis:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "mental-health-crisis"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []

        for p in _CRISIS_PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group(0))

        triggered = len(matched) > 0
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="mental-health-crisis",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Mental health crisis language"
                " detected — include crisis"
                " resources"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": matched,
                    "crisis_resources": [
                        "988 Suicide & Crisis"
                        " Lifeline: call or text 988",
                        "Crisis Text Line: text"
                        " HOME to 741741",
                    ],
                    "reason": (
                        "Text contains mental health"
                        " crisis indicators"
                    ),
                }
                if triggered
                else None
            ),
        )


def mental_health_crisis(
    *, action: str = "block"
) -> _MentalHealthCrisis:
    return _MentalHealthCrisis(action=action)
