"""Detect output filter bypass attempts."""

import re
import time

from open_guardrail.core import GuardResult

_DEFAULT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"respond\s+in\s+base64", re.IGNORECASE,
    ),
    re.compile(
        r"encode\s+your\s+response", re.IGNORECASE,
    ),
    re.compile(
        r"use\s+ROT13", re.IGNORECASE,
    ),
    re.compile(
        r"spell\s+it\s+backwards", re.IGNORECASE,
    ),
    re.compile(
        r"use\s+pig\s+latin", re.IGNORECASE,
    ),
    re.compile(
        r"write\s+in\s+code", re.IGNORECASE,
    ),
    re.compile(
        r"split\s+each\s+character", re.IGNORECASE,
    ),
    re.compile(
        r"use\s+(the\s+)?first\s+letter\s+of"
        r"\s+each\s+word",
        re.IGNORECASE,
    ),
    re.compile(
        r"hypothetically\s+speaking", re.IGNORECASE,
    ),
    re.compile(
        r"output\s+(as|in)\s+(hex|binary|morse)",
        re.IGNORECASE,
    ),
    re.compile(
        r"reverse\s+the\s+(output|text|response)",
        re.IGNORECASE,
    ),
]


class _OutputFilterBypass:
    def __init__(
        self,
        *,
        action: str = "block",
    ) -> None:
        self.name = "output-filter-bypass"
        self.action = action
        self._patterns = list(_DEFAULT_PATTERNS)

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="output-filter-bypass",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Output filter bypass attempt detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains instructions"
                        " requesting encoded or"
                        " obfuscated output to bypass"
                        " safety filters"
                    ),
                }
                if triggered
                else None
            ),
        )


def output_filter_bypass(
    *,
    action: str = "block",
) -> _OutputFilterBypass:
    return _OutputFilterBypass(action=action)
