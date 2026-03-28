"""Detect US driver license number patterns."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_DL_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\b[A-Z]\d{7}\b"),
    re.compile(r"\b[A-Z]\d{12}\b"),
    re.compile(r"\b[A-Z]{2}\d{6}\b"),
    re.compile(r"\b\d{7,9}\b"),
    re.compile(r"\b[A-Z]\d{3}-\d{4}-\d{4}\b"),
    re.compile(
        r"\b[A-Z]{1}\d{4}-\d{5}-\d{5}\b"
    ),
]


class _DriverLicenseDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "driver-license-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _DL_PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 2, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="driver-license-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Driver license number detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def driver_license_detect(
    *, action: str = "block"
) -> _DriverLicenseDetect:
    return _DriverLicenseDetect(action=action)
