"""FERPA: prevent exposure of education records."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_STUDENT_RECORD = re.compile(
    r"\b(?:GPA|grade\s+point\s+average"
    r"|transcript|student\s+ID"
    r"|enrollment\s+status"
    r"|disciplinary\s+record"
    r"|financial\s+aid|student\s+loan"
    r"|academic\s+record|test\s+scores"
    r"|\w+'s\s+grades)\b",
    re.IGNORECASE,
)
_SHARE = re.compile(
    r"\b(?:share\s+with|send\s+to"
    r"|post|publish"
    r"|display\s+publicly"
    r"|email\s+to)\b",
    re.IGNORECASE,
)


class _StudentRecordGuard:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "student-record-guard"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        has_record = bool(
            _STUDENT_RECORD.search(text)
        )
        has_share = bool(_SHARE.search(text))
        triggered = has_record and has_share
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not triggered:
            return GuardResult(
                guard_name="student-record-guard",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="student-record-guard",
            passed=False,
            action=self.action,
            message=(
                "Student record sharing detected"
                " — potential FERPA violation"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "student_record": has_record,
                "sharing_pattern": has_share,
                "reason": (
                    "FERPA prohibits unauthorized"
                    " disclosure of student records"
                ),
            },
        )


def student_record_guard(
    *, action: str = "block"
) -> _StudentRecordGuard:
    return _StudentRecordGuard(action=action)
