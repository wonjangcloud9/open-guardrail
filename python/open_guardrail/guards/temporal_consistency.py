"""Detects future year references for temporal consistency."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_YEAR_RE = re.compile(r"\b(\d{4})\b")


class _TemporalConsistency:
    def __init__(
        self,
        *,
        action: str = "warn",
        current_year: int = 2026,
    ) -> None:
        self.name = "temporal-consistency"
        self.action = action
        self.current_year = current_year

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        future_years: List[int] = []
        for m in _YEAR_RE.finditer(text):
            year = int(m.group(1))
            if year > self.current_year + 1:
                future_years.append(year)
        triggered = len(future_years) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Future year reference detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"future_years": sorted(set(future_years))} if triggered else None,
        )


def temporal_consistency(
    *,
    action: str = "warn",
    current_year: int = 2026,
) -> _TemporalConsistency:
    return _TemporalConsistency(action=action, current_year=current_year)
