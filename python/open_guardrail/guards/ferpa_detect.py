"""Detect FERPA violations: student education record privacy."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_STUDENT_ID_PATTERN = re.compile(
    r"\b(?:student\s*(?:id|number|#))\s*[:=]?\s*[A-Z0-9]{5,12}\b",
    re.IGNORECASE,
)

_EDUCATION_RECORD_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"(?:student|pupil)(?:'?s)?\s+"
        r"(?:grade[s]?|GPA|transcript|report\s*card)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:disciplinary|suspension|expulsion)"
        r"\s+(?:record|action|hearing|report)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:enrollment|enrolment)\s+"
        r"(?:status|record|verification|data)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:academic|education)\s+record",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:class\s+rank|honor\s+roll|dean'?s\s+list)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:special\s+education|IEP|504\s+plan)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:financial\s+aid|scholarship)\s+"
        r"(?:record|application|status)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:attendance|absence)\s+"
        r"(?:record|report|history)",
        re.IGNORECASE,
    ),
]


class _FerpaDetect:
    def __init__(
        self,
        *,
        action: str = "block",
        check_student_id: bool = True,
    ) -> None:
        self.name = "ferpa-detect"
        self.action = action
        self.check_student_id = check_student_id

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        findings: list[str] = []

        if self.check_student_id:
            if _STUDENT_ID_PATTERN.search(text):
                findings.append("student_id_exposed")

        for pat in _EDUCATION_RECORD_PATTERNS:
            if pat.search(text):
                findings.append(pat.pattern)

        triggered = len(findings) > 0
        score = min(len(findings) / 4, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="ferpa-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "FERPA violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "findings_count": len(findings),
                    "reason": (
                        "Text contains student education"
                        " records or identifiers protected"
                        " under FERPA"
                    ),
                }
                if triggered
                else None
            ),
        )


def ferpa_detect(
    *,
    action: str = "block",
    check_student_id: bool = True,
) -> _FerpaDetect:
    return _FerpaDetect(
        action=action, check_student_id=check_student_id
    )
