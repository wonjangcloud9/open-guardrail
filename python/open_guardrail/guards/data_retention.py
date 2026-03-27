"""Detect data retention policy language."""

import re
import time

from open_guardrail.core import GuardResult

_RETENTION_PATTERNS = [
    re.compile(
        r"retain\s+for", re.IGNORECASE
    ),
    re.compile(
        r"stored\s+for\s+\d+\s+"
        r"(?:days?|months?|years?)",
        re.IGNORECASE,
    ),
    re.compile(
        r"data\s+retention", re.IGNORECASE
    ),
    re.compile(
        r"expiration\s+date", re.IGNORECASE
    ),
    re.compile(
        r"delete\s+after", re.IGNORECASE
    ),
]


class _DataRetention:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "data-retention"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        found: list[str] = []

        for pat in _RETENTION_PATTERNS:
            match = pat.search(text)
            if match:
                found.append(match.group())

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        if not found:
            return GuardResult(
                guard_name="data-retention",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        return GuardResult(
            guard_name="data-retention",
            passed=False,
            action=self.action,
            message=(
                "Data retention language detected"
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": found,
                "reason": (
                    "Text contains data retention"
                    " policy language"
                ),
            },
        )


def data_retention(
    *, action: str = "warn"
) -> _DataRetention:
    return _DataRetention(action=action)
