"""Detect unrealistic response time claims and SLA violations."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_UNREALISTIC = [
    re.compile(
        r"\binstant(aneous)?\s+(response|processing|result)",
        re.I,
    ),
    re.compile(
        r"\breal[\s-]?time\b.*"
        r"\b(analys|process|comput|translat)",
        re.I,
    ),
    re.compile(
        r"\b(zero|0)\s*(ms|millisecond|latency)\b",
        re.I,
    ),
    re.compile(r"\bno\s+(delay|latency|wait)\b", re.I),
    re.compile(
        r"\bimmediate(ly)?\s+"
        r"(process|analyz|translat|comput)",
        re.I,
    ),
]

_SLA_VIOLATION = [
    re.compile(
        r"\bguarantee[ds]?\s+(100%\s+)?"
        r"(uptime|availability)",
        re.I,
    ),
    re.compile(
        r"\b(99\.999+|100)%\s+(uptime|availability)",
        re.I,
    ),
    re.compile(
        r"\bnever\s+(goes?\s+down|fail|timeout)",
        re.I,
    ),
    re.compile(
        r"\bzero\s+(downtime|failures)", re.I
    ),
]


class _ApiResponseTime:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "api-response-time"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for p in _UNREALISTIC:
            if p.search(text):
                issues.append("unrealistic_claim")
        for p in _SLA_VIOLATION:
            if p.search(text):
                issues.append("sla_violation")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="api-response-time",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Unrealistic response time claim"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def api_response_time(
    *, action: str = "block"
) -> _ApiResponseTime:
    return _ApiResponseTime(action=action)
