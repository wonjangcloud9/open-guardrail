"""Detect serious incidents requiring mandatory reporting (EU AI Act Art. 62)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_INCIDENT_CATEGORIES: dict[
    str, list[re.Pattern[str]]
] = {
    "safety": [
        re.compile(r"\binjury\b", re.IGNORECASE),
        re.compile(r"\bharm\b", re.IGNORECASE),
        re.compile(r"\bdeath\b", re.IGNORECASE),
        re.compile(r"\bdanger\b", re.IGNORECASE),
        re.compile(
            r"\bemergency\b", re.IGNORECASE
        ),
        re.compile(
            r"\bcritical\s+failure\b",
            re.IGNORECASE,
        ),
    ],
    "rights": [
        re.compile(
            r"\bdiscrimination\b", re.IGNORECASE
        ),
        re.compile(
            r"\bprivacy\s+breach\b", re.IGNORECASE
        ),
        re.compile(
            r"\bunauthorized\s+access\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bdata\s+leak\b", re.IGNORECASE
        ),
    ],
    "system": [
        re.compile(
            r"\bsystem\s+crash\b", re.IGNORECASE
        ),
        re.compile(
            r"\bmodel\s+failure\b", re.IGNORECASE
        ),
        re.compile(
            r"\bhallucination\s+confirmed\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bincorrect\s+diagnosis\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bwrong\s+prediction\b",
            re.IGNORECASE,
        ),
    ],
    "regulatory": [
        re.compile(
            r"\bcompliance\s+violation\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\bregulatory\s+breach\b",
            re.IGNORECASE,
        ),
        re.compile(
            r"\baudit\s+failure\b", re.IGNORECASE
        ),
    ],
}


class _IncidentReportTrigger:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "incident-report-trigger"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        detected: dict[str, list[str]] = {}

        for cat, patterns in (
            _INCIDENT_CATEGORIES.items()
        ):
            matches: list[str] = []
            for p in patterns:
                m = p.search(text)
                if m:
                    matches.append(m.group())
            if matches:
                detected[cat] = matches

        triggered = len(detected) > 0
        categories = list(detected.keys())
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="incident-report-trigger",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Serious incident detected"
                f" ({', '.join(categories)}):"
                " mandatory reporting"
                " may be required"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "incident_categories": categories,
                    "matches": detected,
                    "reason": (
                        "EU AI Act Art. 62 requires"
                        " reporting of serious"
                        " incidents"
                    ),
                }
                if triggered
                else None
            ),
        )


def incident_report_trigger(
    *, action: str = "block"
) -> _IncidentReportTrigger:
    return _IncidentReportTrigger(action=action)
