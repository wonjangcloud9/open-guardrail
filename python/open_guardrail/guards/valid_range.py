"""Validate numbers are within allowed range."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult


class _ValidRange:
    def __init__(
        self,
        *,
        action: str = "block",
        min_val: Optional[float] = None,
        max_val: Optional[float] = None,
        extract_pattern: Optional[str] = None,
    ) -> None:
        self.name = "valid-range"
        self.action = action
        self._min = min_val
        self._max = max_val
        self._pattern = re.compile(
            extract_pattern
            if extract_pattern
            else r"-?\d+(?:\.\d+)?"
        )

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matches = self._pattern.findall(text)
        out_of_range: list[dict] = []

        for m_str in matches:
            try:
                num = float(m_str)
            except ValueError:
                continue
            if self._min is not None and num < self._min:
                out_of_range.append(
                    {
                        "value": num,
                        "reason": (
                            f"below min ({self._min})"
                        ),
                    }
                )
            if self._max is not None and num > self._max:
                out_of_range.append(
                    {
                        "value": num,
                        "reason": (
                            f"above max ({self._max})"
                        ),
                    }
                )

        triggered = len(out_of_range) > 0
        elapsed = (time.perf_counter() - start) * 1000

        detail_strs = [
            f"{o['value']} ({o['reason']})"
            for o in out_of_range
        ]

        return GuardResult(
            guard_name="valid-range",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"{len(out_of_range)} number(s) out of"
                f" range: {', '.join(detail_strs)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "out_of_range": out_of_range,
                    "reason": (
                        "One or more numbers in the"
                        " text fall outside the"
                        " allowed range"
                    ),
                }
                if triggered
                else None
            ),
        )


def valid_range(
    *,
    action: str = "block",
    min_val: Optional[float] = None,
    max_val: Optional[float] = None,
    extract_pattern: Optional[str] = None,
) -> _ValidRange:
    return _ValidRange(
        action=action,
        min_val=min_val,
        max_val=max_val,
        extract_pattern=extract_pattern,
    )
