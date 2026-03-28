"""Validate numeric values in output."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_PERCENT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%")
_PROBABILITY_RE = re.compile(
    r"probability\s+(?:of\s+)?(\d+(?:\.\d+)?)",
    re.IGNORECASE,
)
_TEMPERATURE_RE = re.compile(
    r"(-?\d+(?:\.\d+)?)\s*\u00b0\s*([CF])"
)
_NEGATIVE_COUNT_RE = re.compile(
    r"(-\d+)\s+(items?|people|users?|counts?"
    r"|results?|records?)",
    re.IGNORECASE,
)


class _NumericRangeCheck:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "numeric-range-check"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for m in _PERCENT_RE.finditer(text):
            v = float(m.group(1))
            if v > 100 or v < 0:
                issues.append(f"invalid_percent:{v}")

        for m in _PROBABILITY_RE.finditer(text):
            v = float(m.group(1))
            if 1 < v < 2:
                issues.append(
                    f"invalid_probability:{v}"
                )

        for m in _TEMPERATURE_RE.finditer(text):
            v = float(m.group(1))
            unit = m.group(2)
            if unit == "C" and (v > 1000 or v < -273.15):
                issues.append(
                    f"unreasonable_temp_C:{v}"
                )
            if unit == "F" and (v > 2000 or v < -459.67):
                issues.append(
                    f"unreasonable_temp_F:{v}"
                )

        for m in _NEGATIVE_COUNT_RE.finditer(text):
            issues.append(
                f"negative_count:{m.group(1)}"
            )

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="numeric-range-check",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Numeric range issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def numeric_range_check(
    *, action: str = "warn"
) -> _NumericRangeCheck:
    return _NumericRangeCheck(action=action)
