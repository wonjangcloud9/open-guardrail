"""Prevent AI from completing academic assignments."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_ASSIGN_REQ = re.compile(
    r"\b(?:write\s+my\s+essay"
    r"|do\s+my\s+homework"
    r"|solve\s+this\s+exam"
    r"|answer\s+these\s+test\s+questions"
    r"|complete\s+this\s+assignment)\b",
    re.IGNORECASE,
)
_COMPLETION = re.compile(
    r"\b(?:here\s+is\s+your\s+completed"
    r"\s+assignment"
    r"|here\s+is\s+the\s+essay"
    r"|I've\s+written\s+the\s+paper"
    r"|//\s*Solution:"
    r"|def\s+solution\("
    r"|Answer:\s*[A-E]"
    r"|The\s+correct\s+answer\s+is)\b",
    re.IGNORECASE,
)
_EDU_FRAME = re.compile(
    r"\b(?:here'?s?\s+how\s+to\s+approach"
    r"|let\s+me\s+explain\s+the\s+concept"
    r"|step[- ]by[- ]step\s+guide"
    r"|learning\s+objective)\b",
    re.IGNORECASE,
)


class _AcademicIntegrityOutput:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "academic-integrity-output"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        has_assign = bool(
            _ASSIGN_REQ.search(text)
        )
        has_complete = bool(
            _COMPLETION.search(text)
        )
        has_edu = bool(_EDU_FRAME.search(text))
        triggered = (
            has_assign or has_complete
        ) and not has_edu
        elapsed = (
            time.perf_counter() - start
        ) * 1000
        if not triggered:
            return GuardResult(
                guard_name=(
                    "academic-integrity-output"
                ),
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        return GuardResult(
            guard_name="academic-integrity-output",
            passed=False,
            action=self.action,
            message=(
                "Academic assignment completion"
                " detected without educational"
                " framing"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "assignment_request": has_assign,
                "completion_detected": has_complete,
                "educational_framing": has_edu,
            },
        )


def academic_integrity_output(
    *, action: str = "block"
) -> _AcademicIntegrityOutput:
    return _AcademicIntegrityOutput(
        action=action
    )
