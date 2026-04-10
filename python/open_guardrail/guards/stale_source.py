"""Detect references to potentially stale/outdated sources."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")


class _StaleSource:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_age_years: int = 3,
        current_year: int = 2026,
    ) -> None:
        self.name = "stale-source"
        self.action = action
        self._max_age = max_age_years
        self._cutoff = current_year - max_age_years

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        stale: set[int] = set()

        for m in _YEAR_RE.finditer(text):
            year = int(m.group())
            if year < self._cutoff:
                stale.add(year)

        triggered = len(stale) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="stale-source",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "Stale source references detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "stale_years": sorted(stale),
                    "cutoff": self._cutoff,
                    "max_age_years": self._max_age,
                }
                if triggered
                else None
            ),
        )


def stale_source(
    *,
    action: str = "warn",
    max_age_years: int = 3,
    current_year: int = 2026,
) -> _StaleSource:
    return _StaleSource(
        action=action,
        max_age_years=max_age_years,
        current_year=current_year,
    )
