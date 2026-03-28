"""Detect IBAN numbers for European banking."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_IBAN_PATTERN = re.compile(
    r"\b[A-Z]{2}\d{2}\s?"
    r"[A-Z0-9]{4}(?:\s?[A-Z0-9]{4}){1,7}"
    r"(?:\s?[A-Z0-9]{1,4})?\b"
)


class _IbanDetect:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "iban-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = _IBAN_PATTERN.findall(text)
        triggered = len(matches) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="iban-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=1.0 if triggered else 0.0,
            message=(
                "IBAN detected" if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"iban_count": len(matches)}
                if triggered
                else None
            ),
        )


def iban_detect(
    *, action: str = "block"
) -> _IbanDetect:
    return _IbanDetect(action=action)
