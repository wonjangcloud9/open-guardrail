"""Detect bias based on socioeconomic status."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_PATTERNS = [
    re.compile(
        r"\b(?:poor|low[\s-]income)\s+"
        r"(?:people|families|communities)\s+"
        r"(?:are|can'?t|don'?t|won'?t|always|never)"
        r"\s+\w+",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:rich|wealthy)\s+"
        r"(?:people|families)\s+"
        r"(?:are|tend\s+to\s+be)\s+"
        r"(?:smart|intelligent|better|superior|"
        r"harder[\s-]working)",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:welfare\s+(?:queens?|recipients?|"
        r"leech|leeches|fraud|bums?))\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:uneducated|illiterate|dropouts?)\s+"
        r"(?:people|workers?|masses)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:inner[\s-]city)\s+(?:\w+\s+){0,2}"
        r"(?:crime|violence|thugs?|gangs?|drugs?|"
        r"dangerous|unsafe)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:rural|redneck|hick|hillbilly)\s+"
        r"(?:\w+\s+){0,2}"
        r"(?:people|folks?|communities)\s+"
        r"(?:are|don'?t|can'?t)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:third[\s-]world|undeveloped|"
        r"backwards?)\s+"
        r"(?:country|countries|nation|people)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:people\s+from\s+(?:the\s+)?"
        r"(?:ghetto|slums?|projects?|hood|"
        r"trailer\s+park))\s+"
        r"(?:are|can'?t|don'?t|always|never)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:blue[\s-]collar)\s+"
        r"(?:workers?|people|jobs?)\s+"
        r"(?:are|can'?t|don'?t)\s+"
        r"(?:stupid|dumb|uneducated|simple)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:minimum[\s-]wage\s+workers?)\s+"
        r"(?:are|deserve|should)\s+"
        r"(?:lazy|stupid|unskilled|replaceable)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:homeless\s+"
        r"(?:people|persons?|individuals?))\s+"
        r"(?:are|choose|want|deserve)\s+"
        r"(?:lazy|dangerous|crazy|dirty|criminal)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:trailer[\s-]park|the\s+projects?)\s+"
        r"(?:\w+\s+){0,2}"
        r"(?:trash|scum|lowlife|people\s+are)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:can'?t\s+afford)\s+(?:to\s+)?"
        r"(?:educate|raise|feed)\s+"
        r"(?:their|your)\s+"
        r"(?:kids?|children|family)\b",
        re.IGNORECASE,
    ),
]


class _SocioeconomicBias:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "socioeconomic-bias"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []

        for p in _PATTERNS:
            m = p.search(text)
            if m:
                matched.append(m.group(0))

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="socioeconomic-bias",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f'Socioeconomic bias detected:'
                f' "{matched[0]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": matched,
                    "reason": (
                        "Text contains socioeconomic"
                        " bias or stereotypes"
                    ),
                }
                if triggered
                else None
            ),
        )


def socioeconomic_bias(
    *, action: str = "block"
) -> _SocioeconomicBias:
    return _SocioeconomicBias(action=action)
