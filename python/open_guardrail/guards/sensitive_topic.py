"""Detect sensitive discussion topics."""

import re
import time
from typing import Optional, List

from open_guardrail.core import GuardResult

_ALL_TOPICS: dict[str, list[re.Pattern[str]]] = {
    "religion": [
        re.compile(
            r"\b(religion|religious|church|mosque"
            r"|temple|synagogue|bible|quran|torah"
            r"|buddhis[mt]|hindu|islam|christian"
            r"|jewish|atheis[mt]|prayer|worship)\b",
            re.IGNORECASE,
        ),
    ],
    "politics": [
        re.compile(
            r"\b(politic|democrat|republican"
            r"|liberal|conservative|election|vote"
            r"|congress|parliament|senator"
            r"|president|governor|legislation"
            r"|partisan)\b",
            re.IGNORECASE,
        ),
    ],
    "race": [
        re.compile(
            r"\b(racial|racism|racist|ethnicity"
            r"|ethnic\s+group|racial\s+profiling"
            r"|white\s+supremac|segregation"
            r"|discrimination)\b",
            re.IGNORECASE,
        ),
    ],
    "disability": [
        re.compile(
            r"\b(disabilit|disabled|handicap"
            r"|wheelchair|impairment"
            r"|accessibility|special\s+needs"
            r"|neurodiverg)\b",
            re.IGNORECASE,
        ),
    ],
    "mental_health": [
        re.compile(
            r"\b(mental\s+health|depression"
            r"|anxiety|bipolar|schizophren|ptsd"
            r"|therapy|psychiatr|suicid"
            r"|self[- ]harm)\b",
            re.IGNORECASE,
        ),
    ],
    "substance_abuse": [
        re.compile(
            r"\b(substance\s+abuse|addiction"
            r"|alcoholis[mt]|drug\s+abuse|rehab"
            r"|overdose|narcotic|opioid)\b",
            re.IGNORECASE,
        ),
    ],
    "eating_disorders": [
        re.compile(
            r"\b(eating\s+disorder|anorexi"
            r"|bulimi|binge\s+eating"
            r"|body\s+dysmorphi)\b",
            re.IGNORECASE,
        ),
    ],
    "domestic_violence": [
        re.compile(
            r"\b(domestic\s+violence|abuse"
            r"|batter|intimate\s+partner"
            r"|restraining\s+order)\b",
            re.IGNORECASE,
        ),
    ],
    "terrorism": [
        re.compile(
            r"\b(terroris[mt]|extremis[mt]"
            r"|radicali[sz]|jihad|bomb\s+threat"
            r"|insurgent)\b",
            re.IGNORECASE,
        ),
    ],
}


class _SensitiveTopic:
    def __init__(
        self,
        *,
        action: str = "warn",
        topics: Optional[List[str]] = None,
    ) -> None:
        self.name = "sensitive-topic"
        self.action = action
        self._topics = (
            topics
            if topics is not None
            else list(_ALL_TOPICS.keys())
        )

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for topic in self._topics:
            patterns = _ALL_TOPICS.get(topic, [])
            for pat in patterns:
                if pat.search(text):
                    found.append(topic)
                    break

        triggered = len(found) > 0
        score = (
            min(len(found) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="sensitive-topic",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                f"Sensitive topics: "
                f"{', '.join(found)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"topics": found}
                if triggered
                else None
            ),
        )


def sensitive_topic(
    *,
    action: str = "warn",
    topics: Optional[List[str]] = None,
) -> _SensitiveTopic:
    return _SensitiveTopic(
        action=action, topics=topics
    )
