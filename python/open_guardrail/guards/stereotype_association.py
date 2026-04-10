"""Detect stereotype associations between groups and roles/traits."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_GENDER_OCC = [
    re.compile(
        r"\b(?:female|woman|women|girl)\s+"
        r"(?:nurse|secretary|teacher|maid|"
        r"receptionist|housekeeper)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:male|man|men|boy)\s+"
        r"(?:engineer|programmer|ceo|surgeon|"
        r"pilot|scientist)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:women|girls)\s+"
        r"(?:should|need\s+to|belong|must)\s+"
        r"(?:stay\s+(?:home|at\s+home)|cook|"
        r"clean|be\s+(?:quiet|submissive))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:men|boys)\s+"
        r"(?:don'?t|shouldn'?t|should\s+not|never)"
        r"\s+(?:cry|show\s+emotion|"
        r"be\s+(?:weak|sensitive))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:real\s+(?:men|women))\s+"
        r"(?:don'?t|always|should|never)\b",
        re.IGNORECASE,
    ),
]

_RACE_TRAIT = [
    re.compile(
        r"\b(?:blacks?|african\s*americans?)\s+"
        r"(?:are|tend\s+to\s+be)\s+"
        r"(?:lazy|violent|criminal|aggressive|"
        r"athletic|good\s+at\s+sports)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:asians?|chinese|japanese|korean|"
        r"indian)\s+(?:are|tend\s+to\s+be)\s+"
        r"(?:good\s+at\s+math|smart|nerdy|quiet|"
        r"submissive|sneaky)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:whites?|caucasians?)\s+"
        r"(?:are|tend\s+to\s+be)\s+"
        r"(?:superior|smarter|more\s+civilized)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:hispanics?|latinos?|latinas?|"
        r"mexicans?)\s+(?:are|tend\s+to\s+be)\s+"
        r"(?:lazy|illegal|uneducated|criminal)\b",
        re.IGNORECASE,
    ),
]

_AGE_CAP = [
    re.compile(
        r"\b(?:too\s+old\s+to)\s+"
        r"(?:learn|change|understand|adapt|work)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:millennials?|gen\s*z)\s+"
        r"(?:are|all)\s+"
        r"(?:lazy|entitled|narcissistic|"
        r"snowflakes?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:boomers?|old\s+people)\s+"
        r"(?:don'?t|can'?t|won'?t|refuse\s+to)\s+"
        r"(?:understand|learn|adapt|use)\s+"
        r"(?:technology|tech|computers?|internet)\b",
        re.IGNORECASE,
    ),
]

_NATIONALITY = [
    re.compile(
        r"\b(?:all|every)\s+"
        r"(?:americans?|french|germans?|russians?|"
        r"chinese|indians?|japanese|arabs?|"
        r"africans?|british|italians?)\s+"
        r"(?:are|love|hate|always)\b",
        re.IGNORECASE,
    ),
]

_ALL = _GENDER_OCC + _RACE_TRAIT + _AGE_CAP + _NATIONALITY


class _StereotypeAssociation:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "stereotype-association"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []

        for p in _ALL:
            m = p.search(text)
            if m:
                matched.append(m.group(0))

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="stereotype-association",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f'Stereotype association detected:'
                f' "{matched[0]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": matched,
                    "reason": (
                        "Text contains stereotypical"
                        " associations between groups"
                        " and traits/roles"
                    ),
                }
                if triggered
                else None
            ),
        )


def stereotype_association(
    *, action: str = "block"
) -> _StereotypeAssociation:
    return _StereotypeAssociation(action=action)
