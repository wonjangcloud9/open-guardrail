"""Block collection of data from children under 13 (COPPA)."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CHILD_CTX = re.compile(
    r"\b(?:child|minor|under\s+13"
    r"|elementary\s+school"
    r"|grade\s+school"
    r"|(?:I\s+am|I'm)\s+"
    r"(?:[5-9]|1[0-2])"
    r"\s+years?\s+old)\b",
    re.IGNORECASE,
)
_DATA_COLLECT = re.compile(
    r"\b(?:your\s+(?:name|email|address"
    r"|phone|location)"
    r"|share\s+your|tell\s+me\s+your)\b",
    re.IGNORECASE,
)
_PARENTAL = re.compile(
    r"\b(?:parental\s+consent"
    r"|parent(?:'s|al)?\s+permission"
    r"|guardian\s+consent)\b",
    re.IGNORECASE,
)


class _CoppaComplianceGuard:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "coppa-compliance-guard"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        has_child = bool(_CHILD_CTX.search(text))
        has_collect = bool(
            _DATA_COLLECT.search(text)
        )
        has_consent = bool(
            _PARENTAL.search(text)
        )
        triggered = (
            has_child
            and has_collect
            and not has_consent
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not triggered:
            return GuardResult(
                guard_name="coppa-compliance-guard",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="coppa-compliance-guard",
            passed=False,
            action=self.action,
            message=(
                "Child data collection detected"
                " without parental consent"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "child_context": has_child,
                "data_collection": has_collect,
                "parental_consent": has_consent,
            },
        )


def coppa_compliance_guard(
    *, action: str = "block"
) -> _CoppaComplianceGuard:
    return _CoppaComplianceGuard(action=action)
