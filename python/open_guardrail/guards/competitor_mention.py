"""Detect competitor mentions in text."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult


class _CompetitorMention:
    def __init__(
        self,
        *,
        action: str = "warn",
        competitors: List[str],
    ) -> None:
        self.name = "competitor-mention"
        self.action = action
        self._competitors = competitors

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for comp in self._competitors:
            pattern = r"\b" + re.escape(comp) + r"\b"
            if re.search(pattern, text, re.I):
                found.append(comp)

        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="competitor-mention",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                "Competitors mentioned: "
                + ", ".join(found)
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"found": found} if triggered else None
            ),
        )


def competitor_mention(
    *,
    action: str = "warn",
    competitors: List[str],
) -> _CompetitorMention:
    return _CompetitorMention(
        action=action, competitors=competitors
    )
