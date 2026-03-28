"""Validate currency formatting consistency."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\$[\d,.\s]+\u20ac|\u20ac[\d,.\s]+\$"
        r"|\u00a3[\d,.\s]+\$|\$[\d,.\s]+\u00a3"
        r"|\u00a5[\d,.\s]+\$|\$[\d,.\s]+\u00a5"
    ),
    re.compile(r"\$[\d,]+\.\d{3,}"),
    re.compile(r"\u20ac[\d,]+\.\d{3,}"),
    re.compile(r"\u00a3[\d,]+\.\d{3,}"),
    re.compile(r"-\$|-\u20ac|-\u00a3|-\u00a5"),
    re.compile(
        r"(?:USD|EUR|GBP|JPY)\s*[\$\u20ac\u00a3\u00a5]"
        r"|[\$\u20ac\u00a3\u00a5]\s*(?:USD|EUR|GBP|JPY)",
        re.IGNORECASE,
    ),
    re.compile(
        r"\$[\d,]+\s*(?:euros?|pounds?|yen)", re.IGNORECASE
    ),
    re.compile(
        r"\u20ac[\d,]+\s*(?:dollars?|pounds?|yen)",
        re.IGNORECASE,
    ),
    re.compile(
        r"\u00a3[\d,]+\s*(?:dollars?|euros?|yen)",
        re.IGNORECASE,
    ),
]


class _CurrencyFormat:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "currency-format"
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
            min(len(matched) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="currency-format",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Currency formatting issue detected"
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


def currency_format(
    *, action: str = "warn"
) -> _CurrencyFormat:
    return _CurrencyFormat(action=action)
