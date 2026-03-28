"""Ensure required legal disclaimers are present."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_TOPICS: dict[
    str, dict[str, list[re.Pattern[str]]]
] = {
    "investment": {
        "detect": [
            re.compile(
                r"\b(?:invest|stock|bond|portfolio"
                r"|dividend|share|etf"
                r"|mutual\s+fund)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\b(?:buy|sell|hold)"
                r"\s+(?:stocks?|shares?|bonds?)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\breturn\s+on\s+investment\b",
                re.IGNORECASE,
            ),
        ],
        "disclaimer": [
            re.compile(
                r"\bnot\s+(?:financial|investment)"
                r"\s+advice\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\bconsult\s+(?:a\s+)?"
                r"(?:financial|investment)"
                r"\s+(?:advisor|adviser"
                r"|professional)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\bfor\s+informational"
                r"\s+purposes\s+only\b",
                re.IGNORECASE,
            ),
        ],
    },
    "medical": {
        "detect": [
            re.compile(
                r"\b(?:symptom|diagnos|treatment"
                r"|medic(?:ine|ation)"
                r"|prescri|dosage)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\b(?:disease|condition"
                r"|disorder|illness)\b",
                re.IGNORECASE,
            ),
        ],
        "disclaimer": [
            re.compile(
                r"\bnot\s+(?:medical|health)"
                r"\s+advice\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\bconsult\s+(?:a\s+)?"
                r"(?:doctor|physician"
                r"|healthcare|medical)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\bseek\s+(?:professional\s+)?"
                r"medical\b",
                re.IGNORECASE,
            ),
        ],
    },
    "legal": {
        "detect": [
            re.compile(
                r"\b(?:lawsuit|litigation|statute"
                r"|contract|liability|tort)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\b(?:legal\s+rights?|sue|court"
                r"|attorney|lawyer)\b",
                re.IGNORECASE,
            ),
        ],
        "disclaimer": [
            re.compile(
                r"\bnot\s+legal\s+advice\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\bconsult\s+(?:a\s+)?"
                r"(?:lawyer|attorney"
                r"|legal\s+professional)\b",
                re.IGNORECASE,
            ),
            re.compile(
                r"\bnot\s+a\s+(?:substitute"
                r"\s+for\s+)?legal"
                r"\s+(?:counsel|advice)\b",
                re.IGNORECASE,
            ),
        ],
    },
}


class _LegalDisclaimerCheck:
    def __init__(
        self,
        *,
        action: str = "warn",
        require_for: Optional[List[str]] = None,
    ) -> None:
        self.name = "legal-disclaimer-check"
        self.action = action
        self._topics = require_for or [
            "investment",
            "medical",
            "legal",
        ]

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        missing: list[str] = []

        for topic in self._topics:
            cfg = _TOPICS.get(topic)
            if not cfg:
                continue
            detected = any(
                p.search(text) for p in cfg["detect"]
            )
            if detected:
                has_disc = any(
                    p.search(text)
                    for p in cfg["disclaimer"]
                )
                if not has_disc:
                    missing.append(topic)

        triggered = len(missing) > 0
        score = (
            min(len(missing) / 2, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="legal-disclaimer-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Missing legal disclaimers"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"missing_disclaimers": missing}
                if triggered
                else None
            ),
        )


def legal_disclaimer_check(
    *,
    action: str = "warn",
    require_for: Optional[List[str]] = None,
) -> _LegalDisclaimerCheck:
    return _LegalDisclaimerCheck(
        action=action, require_for=require_for
    )
