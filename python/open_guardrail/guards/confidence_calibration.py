"""Detect miscalibrated confidence in model outputs."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_HIGH: list[re.Pattern[str]] = [
    re.compile(r"\bdefinitely\b", re.IGNORECASE),
    re.compile(r"\bcertainly\b", re.IGNORECASE),
    re.compile(r"\babsolutely\b", re.IGNORECASE),
    re.compile(r"\bwithout\s+doubt\b", re.IGNORECASE),
    re.compile(r"\bguaranteed\b", re.IGNORECASE),
    re.compile(r"\b100\s*%"),
    re.compile(r"\balways\b", re.IGNORECASE),
    re.compile(r"\bnever\b", re.IGNORECASE),
    re.compile(r"\bimpossible\b", re.IGNORECASE),
    re.compile(r"\bundeniable\b", re.IGNORECASE),
]

_HEDGE: list[re.Pattern[str]] = [
    re.compile(r"\bmaybe\b", re.IGNORECASE),
    re.compile(r"\bperhaps\b", re.IGNORECASE),
    re.compile(r"\bpossibly\b", re.IGNORECASE),
    re.compile(r"\bmight\b", re.IGNORECASE),
    re.compile(r"\bcould\s+be\b", re.IGNORECASE),
    re.compile(r"\buncertain\b", re.IGNORECASE),
    re.compile(r"\blikely\b", re.IGNORECASE),
]

_OPINION: list[re.Pattern[str]] = [
    re.compile(r"\bopinion\b", re.IGNORECASE),
    re.compile(r"\bbelieve\b", re.IGNORECASE),
    re.compile(r"\bthink\b", re.IGNORECASE),
    re.compile(r"\bfeel\b", re.IGNORECASE),
    re.compile(r"\bsubjective\b", re.IGNORECASE),
    re.compile(r"\bdebatable\b", re.IGNORECASE),
    re.compile(r"\bargue\b", re.IGNORECASE),
    re.compile(r"\bcontroversial\b", re.IGNORECASE),
    re.compile(r"\bperspective\b", re.IGNORECASE),
    re.compile(r"\bviewpoint\b", re.IGNORECASE),
]


def _count(text: str, pats: list[re.Pattern[str]]) -> int:
    total = 0
    for p in pats:
        total += len(p.findall(text))
    return total


class _ConfidenceCalibration:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_high_confidence_ratio: float = 0.5,
    ) -> None:
        self.name = "confidence-calibration"
        self.action = action
        self._max_ratio = max_high_confidence_ratio

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        high = _count(text, _HIGH)
        hedge = _count(text, _HEDGE)
        total = high + hedge
        ratio = high / total if total > 0 else 0.0
        subjective = any(p.search(text) for p in _OPINION)
        triggered = (
            ratio > self._max_ratio
            and subjective
            and high > 0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="confidence-calibration",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(ratio, 1.0) if triggered else 0.0
            ),
            message=(
                "Overconfidence detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "high_confidence_count": high,
                    "hedging_count": hedge,
                    "ratio": round(ratio, 2),
                }
                if triggered
                else None
            ),
        )


def confidence_calibration(
    *,
    action: str = "warn",
    max_high_confidence_ratio: float = 0.5,
) -> _ConfidenceCalibration:
    return _ConfidenceCalibration(
        action=action,
        max_high_confidence_ratio=max_high_confidence_ratio,
    )
