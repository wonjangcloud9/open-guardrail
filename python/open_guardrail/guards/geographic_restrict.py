"""Geographic restriction guard for compliance."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult


class _GeographicRestrict:
    def __init__(
        self,
        *,
        action: str = "block",
        restricted_regions: List[str],
    ) -> None:
        self.name = "geographic-restrict"
        self.action = action
        self._regions = restricted_regions
        self._patterns = [
            re.compile(
                r"\b" + re.escape(r) + r"\b",
                re.IGNORECASE,
            )
            for r in restricted_regions
        ]

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for i, pat in enumerate(self._patterns):
            if pat.search(text):
                matched.append(self._regions[i])

        triggered = len(matched) > 0
        score = min(len(matched) / 2, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="geographic-restrict",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Restricted region mentioned"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_regions": matched}
                if triggered
                else None
            ),
        )


def geographic_restrict(
    *,
    action: str = "block",
    restricted_regions: List[str],
) -> _GeographicRestrict:
    return _GeographicRestrict(
        action=action,
        restricted_regions=restricted_regions,
    )
