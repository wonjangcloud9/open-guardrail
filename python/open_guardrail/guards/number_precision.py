"""Validate number precision in output."""
from __future__ import annotations

import math
import re
import time

from open_guardrail.core import GuardResult

_DECIMAL_RE = re.compile(r"\b\d+\.(\d+)\b")


class _NumberPrecision:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_decimal_places: int = 6,
    ) -> None:
        self.name = "number-precision"
        self.action = action
        self._max_dp = max_decimal_places

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        dp_list: list[int] = []

        for match in _DECIMAL_RE.finditer(text):
            dp = len(match.group(1))
            dp_list.append(dp)
            if dp > self._max_dp:
                issues.append(
                    f"excessive_precision:"
                    f"{match.group(0)}({dp}dp)"
                )

        if len(dp_list) >= 2:
            unique = set(dp_list)
            rng = max(dp_list) - min(dp_list)
            if len(unique) > 2 and rng > 3:
                issues.append("inconsistent_precision")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="number-precision",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Number precision issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "max_decimal_places": self._max_dp,
                }
                if triggered
                else None
            ),
        )


def number_precision(
    *,
    action: str = "warn",
    max_decimal_places: int = 6,
) -> _NumberPrecision:
    return _NumberPrecision(
        action=action,
        max_decimal_places=max_decimal_places,
    )
