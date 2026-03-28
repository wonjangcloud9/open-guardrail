"""Detect raw database queries in output."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\bSELECT\s+.+?\s+FROM\s+\w+",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bINSERT\s+INTO\s+\w+", re.IGNORECASE
    ),
    re.compile(
        r"\bUPDATE\s+\w+\s+SET\s+", re.IGNORECASE
    ),
    re.compile(
        r"\bDELETE\s+FROM\s+\w+", re.IGNORECASE
    ),
    re.compile(
        r"\bDROP\s+(TABLE|DATABASE)\s+",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bdb\.(find|insert|update|delete"
        r"|aggregate)\s*\(",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bcollection\.(find|insertOne"
        r"|updateOne|deleteOne)\s*\(",
        re.IGNORECASE,
    ),
    re.compile(
        r"mongodb(\+srv)?://[^\s]+", re.IGNORECASE
    ),
    re.compile(
        r"postgres(ql)?://[^\s]+", re.IGNORECASE
    ),
    re.compile(r"mysql://[^\s]+", re.IGNORECASE),
]


class _DatabaseQueryDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "database-query-detect"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = (
            min(len(matched) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="database-query-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Database query detected in output"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"matched_patterns": len(matched)}
                if triggered
                else None
            ),
        )


def database_query_detect(
    *, action: str = "block"
) -> _DatabaseQueryDetect:
    return _DatabaseQueryDetect(action=action)
