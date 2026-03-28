"""Analyze confidence signals: hedging and overconfidence."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult

_HEDGING_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bI think\b", re.IGNORECASE),
    re.compile(r"\bmaybe\b", re.IGNORECASE),
    re.compile(r"\bprobably\b", re.IGNORECASE),
    re.compile(r"\bnot sure\b", re.IGNORECASE),
    re.compile(r"\bmight be\b", re.IGNORECASE),
]

_OVERCONFIDENCE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bdefinitely\b", re.IGNORECASE),
    re.compile(r"\b100%\s*certain\b", re.IGNORECASE),
    re.compile(r"\babsolutely\b", re.IGNORECASE),
    re.compile(r"\bguaranteed\b", re.IGNORECASE),
]


class _ConfidenceScore:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_hedging: int = 3,
        max_overconfidence: int = 2,
    ) -> None:
        self.name = "confidence-score"
        self.action = action
        self._max_hedging = max_hedging
        self._max_overconfidence = max_overconfidence

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        hedge_count = sum(
            len(pat.findall(text))
            for pat in _HEDGING_PATTERNS
        )
        over_count = sum(
            len(pat.findall(text))
            for pat in _OVERCONFIDENCE_PATTERNS
        )

        issues: list[str] = []
        if hedge_count > self._max_hedging:
            issues.append(
                f"excessive hedging: {hedge_count}"
            )
        if over_count > self._max_overconfidence:
            issues.append(
                f"overconfidence: {over_count}"
            )

        triggered = len(issues) > 0
        total = hedge_count + over_count
        score = min(total / 5, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="confidence-score",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Confidence signal issue detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "hedging_count": hedge_count,
                    "overconfidence_count": over_count,
                    "issues": issues,
                    "reason": (
                        "Output contains problematic"
                        " confidence signals indicating"
                        " hedging or overconfidence"
                    ),
                }
                if triggered
                else None
            ),
        )


def confidence_score(
    *,
    action: str = "warn",
    max_hedging: int = 3,
    max_overconfidence: int = 2,
) -> _ConfidenceScore:
    return _ConfidenceScore(
        action=action,
        max_hedging=max_hedging,
        max_overconfidence=max_overconfidence,
    )
