"""Detect geographic stereotypes."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_GEO_BIAS_PATTERNS = [
    re.compile(
        r"people\s+from\s+\w+\s+are\s+always",
        re.IGNORECASE,
    ),
    re.compile(
        r"all\s+\w+(?:\s+people)?\s+are\s+",
        re.IGNORECASE,
    ),
    re.compile(
        r"typical\s+\w+\s+behavior",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:every|all)\s+(?:american|chinese|"
        r"indian|japanese|korean|mexican|"
        r"african|european|russian|brazilian|"
        r"british|french|german|italian|"
        r"arab|australian)s?\s+(?:are|always|"
        r"never|can't|cannot)",
        re.IGNORECASE,
    ),
    re.compile(
        r"those\s+\w+\s+(?:people|folks)\s+"
        r"(?:always|never|can't)",
        re.IGNORECASE,
    ),
]


class _GeographicBias:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "geographic-bias"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _GEO_BIAS_PATTERNS:
            match = pat.search(text)
            if match:
                found.append(match.group())

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not found:
            return GuardResult(
                guard_name="geographic-bias",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="geographic-bias",
            passed=False,
            action=self.action,
            message=(
                "Geographic stereotype detected"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": found,
                "reason": (
                    "Text contains geographic"
                    " stereotyping language"
                ),
            },
        )


def geographic_bias(
    *, action: str = "warn"
) -> _GeographicBias:
    return _GeographicBias(action=action)
