"""Detect signals that need fact-checking."""

import re
import time

from open_guardrail.core import GuardResult

_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"\bstudies\s+show\b", re.IGNORECASE
    ),
    re.compile(
        r"\bresearch\s+proves?\b", re.IGNORECASE
    ),
    re.compile(
        r"\bscientists?\s+(say|found|discovered"
        r"|confirmed)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\baccording\s+to\s+(experts?"
        r"|researchers?|scientists?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b\d{1,3}(\.\d+)?%\s+(of|increase"
        r"|decrease|more|less|higher|lower)\b",
        re.IGNORECASE,
    ),
    re.compile(r"\bin\s+\d{4},?\s+\w+", re.IGNORECASE),
    re.compile(
        r"\bit\s+is\s+(a\s+)?(?:well[- ]known"
        r"|proven|established)\s+fact\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\beveryone\s+knows?\s+that\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bclinical\s+trials?\s+(show|prove"
        r"|demonstrate)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bstatistically\s+(significant|proven)\b",
        re.IGNORECASE,
    ),
]


class _FactCheckSignal:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_unverified_claims: int = 3,
    ) -> None:
        self.name = "fact-check-signal"
        self.action = action
        self._max = max_unverified_claims

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in _PATTERNS:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > self._max
        score = min(
            len(matched) / (self._max + 2), 1.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="fact-check-signal",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                f"Found {len(matched)} unverified"
                f" claims (max {self._max})"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "claims_found": len(matched),
                "max_allowed": self._max,
            },
        )


def fact_check_signal(
    *,
    action: str = "warn",
    max_unverified_claims: int = 3,
) -> _FactCheckSignal:
    return _FactCheckSignal(
        action=action,
        max_unverified_claims=max_unverified_claims,
    )
