"""Telephone Consumer Protection Act checks."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_AUTO_DIAL = re.compile(
    r"\b(?:auto[- ]?dial|robocall"
    r"|automated\s+call)\b",
    re.IGNORECASE,
)
_CONSENT = re.compile(
    r"\b(?:consent|opted\s+in"
    r"|agreed\s+to)\b",
    re.IGNORECASE,
)
_CALL_LIST = re.compile(
    r"\b(?:call\s+list"
    r"|contact\s+list)\b",
    re.IGNORECASE,
)
_DNC_CHECK = re.compile(
    r"\b(?:do[- ]not[- ]call\s+check"
    r"|DNC\s+verified)\b",
    re.IGNORECASE,
)
_LATE_HOURS = re.compile(
    r"\b(?:call\s+at\s+)?"
    r"(?:1[1-2]\s*(?:PM|pm)"
    r"|midnight|[1-5]\s*(?:AM|am)"
    r"|before\s+8\s*(?:AM|am))\b",
    re.IGNORECASE,
)
_MARKETING = re.compile(
    r"\b(?:marketing\s+call"
    r"|promotional)\b",
    re.IGNORECASE,
)
_OPT_OUT = re.compile(
    r"\b(?:opt\s+out|unsubscribe"
    r"|stop)\b",
    re.IGNORECASE,
)


class _TcpaCompliance:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "tcpa-compliance"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        violations: list[str] = []
        if _AUTO_DIAL.search(text) and not _CONSENT.search(text):
            violations.append(
                "Auto-dial without consent"
            )
        if _CALL_LIST.search(text) and not _DNC_CHECK.search(text):
            violations.append(
                "Call list without DNC check"
            )
        if _LATE_HOURS.search(text):
            violations.append(
                "Call during restricted hours"
            )
        if _MARKETING.search(text) and not _OPT_OUT.search(text):
            violations.append(
                "Marketing call without opt-out"
            )
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not violations:
            return GuardResult(
                guard_name="tcpa-compliance",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="tcpa-compliance",
            passed=False,
            action=self.action,
            message=(
                "TCPA violation: "
                + "; ".join(violations)
            ),
            latency_ms=round(elapsed, 2),
            details={"violations": violations},
        )


def tcpa_compliance(
    *, action: str = "block"
) -> _TcpaCompliance:
    return _TcpaCompliance(action=action)
