"""Detect data residency violations based on region policy."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_REGION_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("us-east-1", re.compile(r"us-east-1", re.IGNORECASE)),
    ("us-west-2", re.compile(r"us-west-2", re.IGNORECASE)),
    ("eu-west-1", re.compile(r"eu-west-1", re.IGNORECASE)),
    (
        "eu-central-1",
        re.compile(r"eu-central-1", re.IGNORECASE),
    ),
    (
        "ap-northeast-1",
        re.compile(r"ap-northeast-1", re.IGNORECASE),
    ),
    (
        "ap-southeast-1",
        re.compile(r"ap-southeast-1", re.IGNORECASE),
    ),
    (
        "ap-northeast-2",
        re.compile(r"ap-northeast-2", re.IGNORECASE),
    ),
    (
        "us-east",
        re.compile(r"\bus[- ]east\b", re.IGNORECASE),
    ),
    (
        "us-west",
        re.compile(r"\bus[- ]west\b", re.IGNORECASE),
    ),
    ("europe", re.compile(r"\beurope\b", re.IGNORECASE)),
    (
        "asia-pacific",
        re.compile(r"\basia[- ]pacific\b", re.IGNORECASE),
    ),
]

_CROSS_BORDER: list[re.Pattern[str]] = [
    re.compile(
        r"transfer\s+(data\s+)?(to|from)\s+(another\s+)?"
        r"(country|region|jurisdiction)",
        re.IGNORECASE,
    ),
    re.compile(
        r"cross[- ]border\s+(data|transfer)",
        re.IGNORECASE,
    ),
    re.compile(
        r"data\s+center\s+in\s+\w+", re.IGNORECASE
    ),
    re.compile(
        r"store[ds]?\s+(in|at)\s+(a\s+)?"
        r"\w+\s+data\s*cent",
        re.IGNORECASE,
    ),
]


class _DataResidency:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_regions: List[str],
    ) -> None:
        self.name = "data-residency"
        self.action = action
        self._allowed = {r.lower() for r in allowed_regions}

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for region, pat in _REGION_PATTERNS:
            if pat.search(text) and region.lower() not in self._allowed:
                issues.append(f"disallowed_region:{region}")

        for pat in _CROSS_BORDER:
            if pat.search(text):
                issues.append("cross_border_reference")
                break

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="data-residency",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Data residency violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def data_residency(
    *,
    action: str = "block",
    allowed_regions: List[str],
) -> _DataResidency:
    return _DataResidency(
        action=action, allowed_regions=allowed_regions
    )
